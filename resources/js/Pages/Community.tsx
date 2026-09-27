import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { MessageCircle, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Comment { id: number; body: string; created_at: string; user: { id: number; name: string } }
interface Post { id: number; body: string; created_at: string; user: { id: number; name: string }; comments: Comment[]; comments_count: number }
interface Props extends PageProps { posts: Post[]; canPost: boolean; canModerate: boolean }

const POST_MAX = 2000;
const COMMENT_MAX = 1000;

function CommentBox({ postId }: { postId: number }) {
    const [body, setBody] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    function submit(e: FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;

        setSending(true);
        router.post(route('community.comments.store', postId), { body }, {
            preserveScroll: true,
            onSuccess: () => { setBody(''); setError(null); },
            // Without this a rejected comment simply vanished into a form that
            // still held the text, with nothing on screen to explain why.
            onError: (errors) => setError((errors as Record<string, string>).body ?? 'Your comment could not be posted.'),
            onFinish: () => setSending(false),
        });
    }

    return (
        <form onSubmit={submit} className="mt-3">
            <div className="flex gap-2">
                <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…"
                    maxLength={COMMENT_MAX}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" disabled={sending}
                    className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70 disabled:opacity-50">Reply</button>
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </form>
    );
}

export default function Community({ posts, canPost, canModerate }: Props) {
    const { auth } = usePage<PageProps>().props;
    const [newPost, setNewPost] = useState('');
    const [postError, setPostError] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);

    function submitPost(e: FormEvent) {
        e.preventDefault();
        if (!newPost.trim()) return;

        setPosting(true);
        router.post(route('community.store'), { body: newPost }, {
            onSuccess: () => { setNewPost(''); setPostError(null); },
            onError: (errors) => setPostError((errors as Record<string, string>).body ?? 'Your post could not be published.'),
            onFinish: () => setPosting(false),
        });
    }

    function deletePost(id: number) {
        if (!confirm('Remove this post?')) return;
        router.delete(route('community.destroy', id), { preserveScroll: true });
    }

    function deleteComment(id: number) {
        if (!confirm('Remove this comment?')) return;
        router.delete(route('community.comments.destroy', id), { preserveScroll: true });
    }

    function canModify(ownerId: number): boolean {
        return canModerate || ownerId === auth.user.id;
    }

    return (
        <AuthenticatedLayout>
            <Head title="Alumni Community" />
            <div className="mx-auto max-w-2xl space-y-6">
                <PageHeader icon={Users} title="Alumni Community" subtitle="Connect, share updates, and stay in touch with fellow graduates." />

                {canPost && (
                    <form onSubmit={submitPost} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} rows={3}
                            maxLength={POST_MAX}
                            placeholder="Share an update with the alumni community…"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                        {postError && <p className="mt-1 text-xs text-destructive">{postError}</p>}
                        <div className="mt-2 flex items-center justify-end gap-3">
                            <span className="text-xs text-muted-foreground">{newPost.length}/{POST_MAX}</span>
                            <button type="submit" disabled={posting}
                                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">Post</button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-foreground">{post.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
                                </div>
                                {canModify(post.user.id) && (
                                    <button onClick={() => deletePost(post.id)} className="text-xs text-destructive hover:text-destructive">Delete</button>
                                )}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">{post.body}</p>

                            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageCircle size={13} /> {post.comments_count} comment(s)
                            </div>

                            {post.comments.length > 0 && (
                                <div className="mt-3 space-y-2 border-t border-border pt-3">
                                    {post.comments.map((c) => (
                                        <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">{c.user.name}</p>
                                                <p className="break-words text-sm text-foreground [overflow-wrap:anywhere]">{c.body}</p>
                                            </div>
                                            {canModify(c.user.id) && (
                                                <button onClick={() => deleteComment(c.id)} className="shrink-0 text-xs text-destructive hover:text-destructive">×</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {canPost && <CommentBox postId={post.id} />}
                        </div>
                    ))}
                    {posts.length === 0 && <p className="py-12 text-center text-muted-foreground">No posts yet — be the first to share an update.</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
