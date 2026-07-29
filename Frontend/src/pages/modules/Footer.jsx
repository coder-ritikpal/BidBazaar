import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { getFooterClasses } from '@/styles/modules/footerStyles';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const { theme } = useThemeStore();
  const classes = getFooterClasses(theme);

  return (
    <footer className={classes.footerContainer}>
      <div className={classes.contentWrapper}>
        {/* Section 1: About Us */}
        <div>
          <div className={classes.logoContainer}>
            <img src="/icon.png" alt="BidBazaar Logo" className={classes.footerLogo} />
            <h3 className={classes.appName}>BidBazaar</h3>
          </div>
          <p className={classes.aboutUsDescription}>
            Your premier destination for online auctions. Discover unique items,
            bid with confidence, and connect with a vibrant community of buyers and sellers.
          </p>
        </div>

        {/* Section 2: Customer Service */}
        <div>
          <h3 className={classes.sectionHeading}>Customer Service</h3>
          <ul className={classes.linkList}>
            <li><Link to="/help" className={classes.linkItem}>Contact Us</Link></li>
            <li><Link to="/help" className={classes.linkItem}>FAQ</Link></li>
            <li><Link to="/shipping-returns" className={classes.linkItem}>Shipping & Returns</Link></li>
            <li><Link to="/privacy-policy" className={classes.linkItem}>Privacy Policy</Link></li>
            <li><Link to="/terms-and-conditions" className={classes.linkItem}>Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Section 3: Quick Links */}
        <div>
          <h3 className={classes.sectionHeading}>Quick Links</h3>
          <ul className={classes.linkList}>
            <li><Link to="/auctions" className={classes.linkItem}>All Auctions</Link></li>
            <li><Link to="/categories" className={classes.linkItem}>Categories</Link></li>
            <li><Link to="/how-it-works" className={classes.linkItem}>How It Works</Link></li>
            <li><Link to="/login" className={classes.linkItem}>Start Selling</Link></li>
            <li><Link to="/wishlist" className={classes.linkItem}>Wishlist</Link></li>
          </ul>
        </div>

        {/* Section 4: Follow Us */}
        <div>
          <h3 className={classes.sectionHeading}>Follow Us</h3>
          <div className={classes.socialIconsContainer}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={classes.socialIcon} aria-label="Facebook">
              <Facebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={classes.socialIcon} aria-label="Twitter">
              <Twitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={classes.socialIcon} aria-label="Instagram">
              <Instagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={classes.socialIcon} aria-label="LinkedIn">
              <Linkedin />
            </a>
          </div>
        </div>
      </div>

      <div className={classes.copyrightText}>
        &copy; {new Date().getFullYear()} BidBazaar. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
