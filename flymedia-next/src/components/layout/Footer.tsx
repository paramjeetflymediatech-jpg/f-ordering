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
            alt="F-Ordering POS Platform" 
            width={180} 
            height={60} 
            className={styles.footerLogo}
          />
          <p className={styles.desc}>
            F-Ordering is a premium cloud-based restaurant POS and online ordering SaaS platform. Empowering outlets, streamlining billing, and growing restaurant profits.
          </p>
        </div>
        
        <div className={styles.col}>
          <h3>Quick Links</h3>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/portfolio">Our Portfolio</Link></li>
            <li><Link href="/contact">Contact Support</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>POS Modules</h3>
          <ul>
            <li><Link href="/pos">POS Billing Terminal</Link></li>
            <li><Link href="/kds">Kitchen Display (KDS)</Link></li>
            <li><Link href="/register">QR Table Ordering</Link></li>
            <li><Link href="/register">Waiter POS Terminal</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3>Contact Us</h3>
          <p>Email: support@fordering.com</p>
          <p>Phone: +1-555-0199</p>
          <p>Location: San Francisco, CA, USA</p>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} F-Ordering. Powered by Flymedia Tech. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

