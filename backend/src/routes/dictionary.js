import { Router } from 'express';
import prisma from '../lib/db.js';
import logger from '../lib/logger.js';

const router = Router();

/**
 * Dictionary API - Lookup word definitions
 * Powered by Kaikki Wiktionary data (~1M entries)
 */

// GET /api/dictionary/:word - Get definition for a single word
router.get('/:word', async (req, res) => {
    try {
        const { word } = req.params;

        if (!word || word.length < 2 || word.length > 50) {
            return res.status(400).json({
                found: false,
                error: 'Word must be 2-50 characters'
            });
        }

        const definition = await prisma.definition.findFirst({
            where: {
                word: word.toUpperCase()
            },
        });

        if (!definition) {
            return res.status(404).json({
                found: false,
                word: word.toUpperCase(),
                message: 'No definition found'
            });
        }

        // Parse JSON fields
        let examples = [];
        let synonyms = [];
        let antonyms = [];

        try {
            if (definition.examples) examples = JSON.parse(definition.examples);
            if (definition.synonyms) synonyms = JSON.parse(definition.synonyms);
            if (definition.antonyms) antonyms = JSON.parse(definition.antonyms);
        } catch (e) {
            // Ignore parse errors
        }

        res.json({
            found: true,
            word: definition.word,
            pos: definition.pos,
            definition: definition.definition,
            ipa: definition.ipa,
            etymology: definition.etymology,
            examples,
            synonyms,
            antonyms,
        });
    } catch (error) {
        logger.error('Dictionary lookup error', {
            word: req.params.word,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            found: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/dictionary/search/:query - Search for words (autocomplete)
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        if (!query || query.length < 2) {
            return res.json({ results: [] });
        }

        const results = await prisma.definition.findMany({
            where: {
                word: {
                    startsWith: query.toUpperCase(),
                },
            },
            select: {
                word: true,
                pos: true,
                definition: true,
            },
            take: limit,
            orderBy: {
                word: 'asc',
            },
        });

        res.json({
            query: query.toUpperCase(),
            count: results.length,
            results: results.map(r => ({
                word: r.word,
                pos: r.pos,
                preview: r.definition.substring(0, 100) + (r.definition.length > 100 ? '...' : ''),
            })),
        });
    } catch (error) {
        logger.error('Dictionary search error', {
            query: req.params.query,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            results: [],
            error: 'Internal server error'
        });
    }
});

// GET /api/dictionary/random - Get a random word (Word of the Day feature)
router.get('/random/word', async (req, res) => {
    try {
        // Get count
        const count = await prisma.definition.count();

        if (count === 0) {
            return res.status(404).json({
                found: false,
                message: 'No definitions available'
            });
        }

        // Random offset
        const skip = Math.floor(Math.random() * count);

        const definition = await prisma.definition.findFirst({
            skip,
            take: 1,
        });

        if (!definition) {
            return res.status(404).json({ found: false });
        }

        let examples = [];
        try {
            if (definition.examples) examples = JSON.parse(definition.examples);
        } catch (e) { }

        res.json({
            found: true,
            word: definition.word,
            pos: definition.pos,
            definition: definition.definition,
            ipa: definition.ipa,
            examples,
        });
    } catch (error) {
        logger.error('Random word error', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            found: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/dictionary/stats - Get dictionary statistics
router.get('/stats/info', async (req, res) => {
    try {
        const total = await prisma.definition.count();

        // Count by POS
        const posCounts = await prisma.definition.groupBy({
            by: ['pos'],
            _count: true,
            orderBy: {
                _count: {
                    pos: 'desc',
                },
            },
            take: 10,
        });

        res.json({
            total,
            byPartOfSpeech: posCounts.map(p => ({
                pos: p.pos,
                count: p._count,
            })),
        });
    } catch (error) {
        logger.error('Dictionary stats error', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
