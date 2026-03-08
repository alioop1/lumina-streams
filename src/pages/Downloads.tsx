import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRDTorrents, useRDDownloads, useRDUser, useRDAddMagnet, useRDDeleteTorrent } from '@/hooks/useRealDebrid';
import { Loader2, Trash2, Plus, HardDrive, Download, User, Link, ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 px-6 3xl:px-10 4k:px-14" dir={dir}>
      <div className="flex items-center justify-between mb-6 3xl:mb-8">
        <h1 className="font-display text-3xl 3xl:text-4xl 4k:text-5xl text-foreground">
          {lang === 'he' ? 'הורדות' : 'Downloads'}
        </h1>
        <div data-nav-row="dl-add">
          <button
            onClick={() => setShowAddMagnet(true)}
            className="tv-focus glass w-10 h-10 3xl:w-12 3xl:h-12 4k:w-14 4k:h-14 rounded-full flex items-center justify-center text-foreground outline-none"
          >
            <Plus className="w-5 h-5 3xl:w-6 3xl:h-6" />
          </button>
        </div>
      </div>

      {/* Feature: User info card */}
      {user && (
        <div className="glass rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 mb-4 3xl:mb-6 flex items-center gap-3 3xl:gap-4">
          <div className="w-10 h-10 3xl:w-12 3xl:h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 3xl:w-6 3xl:h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm 3xl:text-base font-medium text-foreground">{user.username}</p>
            <p className="text-xs 3xl:text-sm text-muted-foreground">
              {user.type === 'premium' ? '⭐ Premium' : 'Free'} · {lang === 'he' ? 'נקודות:' : 'Points:'} {user.points}
            </p>
          </div>
        </div>
      )}

      {showAddMagnet && (
        <div className="glass rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 mb-4 3xl:mb-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground text-sm 3xl:text-base font-medium">
            <Link className="w-4 h-4 3xl:w-5 3xl:h-5" />
            {lang === 'he' ? 'הוסף מגנט / טורנט' : 'Add Magnet / Torrent'}
          </div>
          <div data-nav-row="dl-magnet-input" className="flex gap-2 3xl:gap-3">
            <input
              value={magnetInput}
              onChange={e => setMagnetInput(e.target.value)}
              placeholder="magnet:?xt=..."
              className="tv-focus flex-1 bg-secondary text-foreground placeholder:text-muted-foreground px-3 3xl:px-4 py-2.5 3xl:py-3 rounded-lg 3xl:rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm 3xl:text-base"
              dir="ltr"
            />
            <button
              onClick={handleAddMagnet}
              disabled={addMagnet.isPending || !magnetInput.trim()}
              className="tv-focus bg-primary text-primary-foreground px-4 3xl:px-6 py-2.5 3xl:py-3 rounded-lg 3xl:rounded-xl font-medium text-sm 3xl:text-base disabled:opacity-50 flex items-center gap-2 outline-none"
            >
              {addMagnet.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === 'he' ? 'הוסף' : 'Add'}
            </button>
          </div>
          <div data-nav-row="dl-magnet-cancel">
            <button onClick={() => setShowAddMagnet(false)} className="tv-focus text-xs 3xl:text-sm text-muted-foreground outline-none">
              {lang === 'he' ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div data-nav-row="dl-tabs" className="flex gap-2 3xl:gap-3 mb-4 3xl:mb-6">
        <button
          onClick={() => setActiveTab('torrents')}
          className={`tv-focus flex-1 flex items-center justify-center gap-2 3xl:gap-3 py-2.5 3xl:py-3.5 4k:py-4 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base 4k:text-lg font-medium outline-none ${
            activeTab === 'torrents' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
          }`}
        >
          <HardDrive className="w-4 h-4 3xl:w-5 3xl:h-5" />
          {lang === 'he' ? 'טורנטים' : 'Torrents'}
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`tv-focus flex-1 flex items-center justify-center gap-2 3xl:gap-3 py-2.5 3xl:py-3.5 4k:py-4 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base 4k:text-lg font-medium outline-none ${
            activeTab === 'downloads' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
          }`}
        >
          <Download className="w-4 h-4 3xl:w-5 3xl:h-5" />
          {lang === 'he' ? 'הורדות' : 'Downloads'}
        </button>
      </div>

      {activeTab === 'torrents' && (
        <div data-nav-row="dl-torrent-list" className="space-y-2 3xl:space-y-3 max-w-4xl 3xl:max-w-5xl">
          {torrentsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 3xl:w-10 3xl:h-10 text-primary animate-spin" />
            </div>
          )}
          {!torrentsLoading && torrentsList.length === 0 && (
            <div className="text-center text-muted-foreground py-12 3xl:py-16">
              <HardDrive className="w-12 h-12 3xl:w-16 3xl:h-16 mx-auto mb-2 opacity-50" />
              <p className="text-base 3xl:text-lg">{lang === 'he' ? 'אין טורנטים' : 'No torrents'}</p>
            </div>
          )}
          {torrentsList.map((torrent: any) => (
            <div key={torrent.id} className="glass rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 space-y-2 3xl:space-y-3">
              <div className="flex items-start justify-between gap-2 3xl:gap-3">
                <p className="text-sm 3xl:text-base font-medium text-foreground flex-1 truncate" dir="ltr">{torrent.filename}</p>
                <button
                  onClick={() => deleteTorrent.mutate(torrent.id)}
                  className="tv-focus text-muted-foreground outline-none p-1"
                >
                  <Trash2 className="w-4 h-4 3xl:w-5 3xl:h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs 3xl:text-sm text-muted-foreground">
                <span>{formatSize(torrent.bytes)}</span>
                <span className={`px-2 3xl:px-3 py-0.5 3xl:py-1 rounded text-xs 3xl:text-sm ${
                  torrent.status === 'downloaded' ? 'bg-green-500/20 text-green-400' :
                  torrent.status === 'downloading' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>{torrent.status}</span>
              </div>
              {torrent.status === 'downloading' && (
                <div className="w-full bg-muted rounded-full h-1.5 3xl:h-2">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${torrent.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'downloads' && (
        <div data-nav-row="dl-download-list" className="space-y-2 3xl:space-y-3 max-w-4xl 3xl:max-w-5xl">
          {downloadsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 3xl:w-10 3xl:h-10 text-primary animate-spin" />
            </div>
          )}
          {!downloadsLoading && downloadsList.length === 0 && (
            <div className="text-center text-muted-foreground py-12 3xl:py-16">
              <Download className="w-12 h-12 3xl:w-16 3xl:h-16 mx-auto mb-2 opacity-50" />
              <p className="text-base 3xl:text-lg">{lang === 'he' ? 'אין הורדות' : 'No downloads'}</p>
            </div>
          )}
          {downloadsList.map((dl: any) => (
            <a
              key={dl.id}
              href={dl.download}
              target="_blank"
              rel="noopener noreferrer"
              className="tv-focus glass rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 flex items-center gap-3 3xl:gap-4 block outline-none"
            >
              <div className="w-10 h-10 3xl:w-12 3xl:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 3xl:w-6 3xl:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm 3xl:text-base font-medium text-foreground truncate" dir="ltr">{dl.filename}</p>
                <p className="text-xs 3xl:text-sm text-muted-foreground">{formatSize(dl.filesize)} · {dl.host}</p>
              </div>
              <ExternalLink className="w-4 h-4 3xl:w-5 3xl:h-5 text-muted-foreground flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Downloads;