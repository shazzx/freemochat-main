import { Page } from "./types";

export function PageList({ pages }: { pages: Page[] }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <div key={page._id} className="flex items-center p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
              {page.avatar ? (
                <img 
                  src={page.avatar} 
                  alt={page.name} 
                  className="h-full w-full rounded-lg object-cover" 
                />
              ) : (
                <span className="text-lg">{page.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-medium">{page.name || page.handle}</h3>
              <p className="text-sm text-gray-500">@{page.handle}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  