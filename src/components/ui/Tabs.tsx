import { Button } from "./Button";

export default function Tabs({ type, setType }: { type: string, setType: (type: string) => void }) {
    return (
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm bg-card border border-border" role="group">
          <Button
            type="button"
            variant={type === 'LINK' ? 'default' : 'ghost'}
            onClick={() => setType('LINK')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${type === 'LINK' ? '' : 'hover:bg-muted'}`}
          >
            Link
          </Button>
          <Button
            type="button"
            variant={type === 'TEXT' ? 'default' : 'ghost'}
            onClick={() => setType('TEXT')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border-l border-border ${type === 'TEXT' ? '' : 'hover:bg-muted'}`}
          >
            Text
          </Button>
        </div>
      </div>
    )}