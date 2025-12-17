import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
