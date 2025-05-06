import { Post } from "./types";


export function PostList({ posts }: { posts: Post[] }) {
    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post._id} className="p-4 border rounded-lg">
                    <p className="mb-2">{post.content.length > 150
                        ? `${post.content.substring(0, 150)}...`
                        : post.content}
                    </p>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>By: {post.author}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
