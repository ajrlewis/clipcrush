// src/components/SongSelector.tsx
interface Props {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    onSelect: (e: React.FormEvent) => void;
    loading: boolean;
  }
  
  export function SongSelector({ searchQuery, setSearchQuery, onSelect, loading }: Props) {
    return (
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <h2 className="text-center text-xl font-bold text-[#ffe66d]">Choose a Song</h2>
        <form onSubmit={onSelect} className="flex flex-col gap-4">
          <input 
            autoFocus
            className="bg-black/50 p-4 rounded-xl text-lg border border-[#b026ff]/40 text-white..." 
            placeholder="Search Artist/Title..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button disabled={loading} className="...">
            {loading ? 'Fetching...' : 'Lock it in'}
          </button>
        </form>
      </div>
    );
  }