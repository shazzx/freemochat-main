
export function GroupList({ groups }: { groups: Group[] }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group._id} className="flex items-center p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              {group.avatar ? (
                <img 
                  src={group.avatar} 
                  alt={group.name} 
                  className="h-full w-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-lg">{group.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-medium">{group.name || group.handle}</h3>
              <p className="text-sm text-gray-500">@{group.handle}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  