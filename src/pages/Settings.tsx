import { ChevronLeft } from 'lucide-react';

const settingsItems = [
  { label: 'חשבון', desc: 'פרטי חשבון והתחברות', icon: '👤' },
  { label: 'איכות וידאו', desc: 'בחר איכות סטרימינג ברירת מחדל', icon: '🎬' },
  { label: 'כתוביות', desc: 'שפה, גודל וסגנון כתוביות', icon: '💬' },
  { label: 'התראות', desc: 'ניהול התראות פוש', icon: '🔔' },
  { label: 'שפת ממשק', desc: 'עברית', icon: '🌐' },
  { label: 'גודל ממשק', desc: 'שנה את גודל הטקסט והאלמנטים', icon: '🔤' },
  { label: 'מטמון', desc: 'נקה קבצים שמורים', icon: '🗑️' },
  { label: 'אודות', desc: 'Lumina Streams v1.0', icon: 'ℹ️' },
];

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir="rtl">
      <h1 className="font-display text-3xl text-foreground mb-6">הגדרות</h1>

      <div className="space-y-2">
        {settingsItems.map(item => (
          <button
            key={item.label}
            className="w-full glass rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors text-right"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
