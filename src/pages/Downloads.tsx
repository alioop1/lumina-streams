import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRDTorrents, useRDDownloads, useRDUser, useRDAddMagnet, useRDDeleteTorrent } from '@/hooks/useRealDebrid';
import { Loader2, Trash2, Plus, HardDrive, Download, User, Link } from 'lucide-react';

const Downloads = () => {
  const { t, dir, lang } = useLanguage();
  const { data: user } = useRDUser();
  const { data: torrents, isLoading: torrentsLoading } = useRDTorrents();
  const { data: downloads, isLoading: downloadsLoading } = useRDDownloads();
  const torrentsList = Array.isArray(torrents) ? torrents : [];
  const downloadsList = Array.isArray(downloads) ? downloads : [];
  const addMagnet = useRDAddMagnet();
  const deleteTorrent = useRDDeleteTorrent();

  const [showAddMagnet, setShowAddMagnet] = useState(false);
  const [magnetInput, setMagnetInput] = useState('');
  const [activeTab, setActiveTab] = useState<'torrents' | 'downloads'>('torrents');

  const handleAddMagnet = async () => {
    if (!magnetInput.trim()) return;
    try {
      await addMagnet.mutateAsync(magnetInput.trim());
      setMagnetInput('');
      setShowAddMagnet(false);
    } catch (e) {
      console.error('Add magnet failed:', e);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(1)} KB`;
  };

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-foreground">
          {lang === 'he' ? 'הורדות' : 'Downloads'}
        </h1>
        <button
          onClick={() => setShowAddMagnet(true)}
          className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {user && (
        <div className="glass rounded-xl p-4 mb-4 flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{user.username}</p>
            <p className="text-xs text-muted-foreground">
              {user.type === 'premium' ? '⭐ Premium' : 'Free'} · {lang === 'he' ? 'נקודות:' : 'Points:'} {user.points}
            </p>
          </div>
        </div>
      )}

      {showAddMagnet && (
        <div className="glass rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2 text-foreground text-sm font-medium">
            <Link className="w-4 h-4" />
            {lang === 'he' ? 'הוסף מגנט / טורנט' : 'Add Magnet / Torrent'}
          </div>
          <div className="flex gap-2">
            <input
              value={magnetInput}
              onChange={e => setMagnetInput(e.target.value)}
              placeholder="magnet:?xt=..."
              className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm tv-focus"
              dir="ltr"
            />
            <button
              onClick={handleAddMagnet}
              disabled={addMagnet.isPending || !magnetInput.trim()}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 tv-focus flex items-center gap-2"
            >
              {addMagnet.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === 'he' ? 'הוסף' : 'Add'}
            </button>
          </div>
          <button
            onClick={() => setShowAddMagnet(false)}
            className="text-xs text-muted-foreground hover:text-foreground tv-focus"
          >
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('torrents')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all tv-focus ${
            activeTab === 'torrents' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          {lang === 'he' ? 'טורנטים' : 'Torrents'}
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all tv-focus ${
            activeTab === 'downloads' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
          }`}
        >
          <Download className="w-4 h-4" />
          {lang === 'he' ? 'הורדות' : 'Downloads'}
        </button>
      </div>

      {activeTab === 'torrents' && (
        <div className="space-y-2">
          {torrentsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {!torrentsLoading && torrents?.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{lang === 'he' ? 'אין טורנטים' : 'No torrents'}</p>
            </div>
          )}
          {torrents?.map((torrent: any) => (
            <div key={torrent.id} className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground flex-1 truncate" dir="ltr">
                  {torrent.filename}
                </p>
                <button
                  onClick={() => deleteTorrent.mutate(torrent.id)}
                  className="text-muted-foreground hover:text-destructive tv-focus flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatSize(torrent.bytes)}</span>
                <span className={`px-2 py-0.5 rounded ${
                  torrent.status === 'downloaded' ? 'bg-green-500/20 text-green-400' :
                  torrent.status === 'downloading' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {torrent.status}
                </span>
                {torrent.progress > 0 && torrent.progress < 100 && (
                  <span>{torrent.progress}%</span>
                )}
              </div>
              {torrent.status === 'downloading' && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${torrent.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'downloads' && (
        <div className="space-y-2">
          {downloadsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {!downloadsLoading && downloads?.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Download className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{lang === 'he' ? 'אין הורדות' : 'No downloads'}</p>
            </div>
          )}
          {downloads?.map((dl: any) => (
            <a
              key={dl.id}
              href={dl.download}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl p-4 flex items-center gap-3 tv-focus block"
            >
              <Download className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" dir="ltr">
                  {dl.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(dl.filesize)} · {dl.host}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Downloads;
