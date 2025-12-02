const Footer = () => {
  return (
    <footer className="py-10 px-6 border-t border-border">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-2xl">YOUNG.</p>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Young. Unite to Disrupt.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
