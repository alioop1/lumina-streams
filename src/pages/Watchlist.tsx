const Watchlist = () => {
  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir="rtl">
      <h1 className="font-display text-3xl text-foreground mb-6">הרשימה שלי</h1>
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4">
          <span className="text-3xl">📑</span>
        </div>
        <p className="text-muted-foreground">הרשימה שלך ריקה</p>
        <p className="text-sm text-muted-foreground mt-1">הוסף סרטים וסדרות לצפייה מאוחרת</p>
      </div>
    </div>
  );
};

export default Watchlist;
