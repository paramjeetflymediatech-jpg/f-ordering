'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

const Footer = () => {
  const pathname = usePathname();
  const isAppPage = ['/pos', '/dashboard', '/login', '/register'].some(path => pathname?.startsWith(path));

  if (isAppPage) return null;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <div className={styles.col}>
          <Image 
            src="/logo.png" 
            alt="Flymedia Tech" 
            width={180} 
            height={60} 
            className={styles.footerLogo}
          />
          <p className={styles.desc}>
            Flymedia Tech is a leading digital marketing agency providing SEO, Web Design, and PPC services to help businesses grow online.
          </p>
        </div>
        
        <div className={styles.col}>
          <h3>Quick Links</h3>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/portfolio">Portfolio</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>Services</h3>
          <ul>
            <li><Link href="/services/seo">SEO Services</Link></li>
            <li><Link href="/services/web-design">Web Design</Link></li>
            <li><Link href="/services/ppc">PPC Marketing</Link></li>
            <li><Link href="/services/social-media">Social Media</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>Contact Us</h3>
          <p>Email: info@flymediatech.com</p>
          <p>Phone: +91 9876543210</p>
          <p>Location: Ludhiana, Punjab, India</p>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Flymedia Tech. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

