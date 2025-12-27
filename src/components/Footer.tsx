import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border/50 bg-young-cream/30">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link 
          to="/" 
          className="font-display text-xl text-foreground hover:text-young-blue transition-colors duration-200"
        >
          YOUNG RECRUITMENT.
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Young Recruitment. Unite to Disrupt.
          </p>
          <span className="text-border">·</span>
          <Link 
            to="/auth" 
            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-200"
          >
            Acceso Recruiters
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
