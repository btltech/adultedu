-- Canonicalize the legacy GCSE expansion taxonomy after the application has
-- been made tolerant of both old and new values.
DO $$
DECLARE
    canonical_gcse_id TEXT;
    legacy_gcse_id TEXT;
    computer_science_track_id TEXT;
    eds_framework_id TEXT;
BEGIN
    SELECT id INTO canonical_gcse_id FROM frameworks WHERE slug = 'GCSE';
    SELECT id INTO legacy_gcse_id FROM frameworks WHERE slug = 'gcse';

    IF canonical_gcse_id IS NULL AND legacy_gcse_id IS NOT NULL THEN
        UPDATE frameworks
        SET slug = 'GCSE', title = 'GCSE'
        WHERE id = legacy_gcse_id;

        canonical_gcse_id := legacy_gcse_id;
        legacy_gcse_id := NULL;
    ELSIF canonical_gcse_id IS NOT NULL AND legacy_gcse_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM outcomes WHERE framework_id = legacy_gcse_id) THEN
            RAISE EXCEPTION 'Refusing to merge legacy GCSE framework with linked outcomes';
        END IF;

        INSERT INTO track_frameworks (track_id, framework_id)
        SELECT track_id, canonical_gcse_id
        FROM track_frameworks
        WHERE framework_id = legacy_gcse_id
        ON CONFLICT (track_id, framework_id) DO NOTHING;

        DELETE FROM track_frameworks WHERE framework_id = legacy_gcse_id;
        DELETE FROM frameworks WHERE id = legacy_gcse_id;
    END IF;

    -- No GCSE framework of either spelling means there is no taxonomy to
    -- canonicalise. That is the state of every fresh database, because
    -- migrations run before seeding, so skip the GCSE-specific work instead of
    -- failing. Reaching here with a legacy row present is impossible: the
    -- branches above rename or merge it into the canonical row first.
    IF canonical_gcse_id IS NULL THEN
        -- The category rename is independent of GCSE and is a no-op when empty.
        UPDATE tracks
        SET category = 'qual_prep'
        WHERE category = 'qualifications';

        IF EXISTS (SELECT 1 FROM tracks WHERE category = 'qualifications') THEN
            RAISE EXCEPTION 'Legacy qualifications category still exists';
        END IF;

        RETURN;
    END IF;

    UPDATE tracks
    SET category = 'qual_prep'
    WHERE category = 'qualifications';

    SELECT id INTO computer_science_track_id
    FROM tracks
    WHERE slug = 'gcse-computer-science';

    SELECT id INTO eds_framework_id
    FROM frameworks
    WHERE slug = 'EDS';

    IF computer_science_track_id IS NOT NULL THEN
        INSERT INTO track_frameworks (track_id, framework_id)
        VALUES (computer_science_track_id, canonical_gcse_id)
        ON CONFLICT (track_id, framework_id) DO NOTHING;

        IF eds_framework_id IS NOT NULL THEN
            DELETE FROM track_frameworks
            WHERE track_id = computer_science_track_id
              AND framework_id = eds_framework_id;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM tracks WHERE category = 'qualifications') THEN
        RAISE EXCEPTION 'Legacy qualifications category still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM frameworks WHERE slug = 'gcse') THEN
        RAISE EXCEPTION 'Legacy lowercase GCSE framework still exists';
    END IF;

    IF computer_science_track_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM track_frameworks
        WHERE track_id = computer_science_track_id
          AND framework_id = canonical_gcse_id
    ) THEN
        RAISE EXCEPTION 'GCSE Computer Science is not linked to canonical GCSE';
    END IF;
END $$;
