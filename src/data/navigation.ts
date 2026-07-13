export const navigationLinks = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export const footerNavigationLinks = [...navigationLinks, { to: "/auth/signin", label: "Sign In" }] as const;
