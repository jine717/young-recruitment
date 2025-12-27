import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-border/50 bg-young-cream/30">
      <div className="container mx-auto flex flex-col items-center justify-center gap-3 md:flex-row md:justify-between md:gap-4">
        <Link 
          to="/" 
          className="font-display text-lg md:text-xl text-foreground hover:text-young-blue transition-colors duration-200"
        >
          YOUNG RECRUITMENT.
        </Link>
        <p className="text-xs md:text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Young Recruitment. Unite to Disrupt.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
