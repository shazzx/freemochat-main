import { User } from "./types";

export function UserList({ users }: { users: User[] }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user._id} className="flex items-center p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="h-full w-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-lg">{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-medium">{user.username}</h3>
              <p className="text-sm text-gray-500">User</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  