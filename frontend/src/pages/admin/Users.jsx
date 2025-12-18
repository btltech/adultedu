
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Search, MoreVertical, Mail, Calendar, User as UserIcon } from 'lucide-react'

export default function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page,
                limit: 15,
                search
            })
            const data = await api.get(`/admin/users?${params}`)
            setUsers(data.users)
            setTotalPages(data.pagination.pages)
        } catch (err) {
            console.error('Failed to fetch users:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 300)
        return () => clearTimeout(timeout)
    }, [page, search])

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-400">
                        User Management
                    </h1>
                    <p className="text-dark-400 mt-1">View and manage registered learners</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="solid-card p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        className="input pl-10 py-2 text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search Users"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="solid-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-dark-900/50 text-dark-400 text-xs uppercase font-medium border-b border-dark-700">
                        <tr>
                            <th className="p-4 w-12"></th>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/50">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-dark-400">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-dark-400">No users found.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-dark-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center">
                                            <UserIcon size={16} />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-dark-100 font-medium">{user.email}</span>
                                            <span className="text-xs text-dark-500">{user.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-dark-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-600 rounded">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
