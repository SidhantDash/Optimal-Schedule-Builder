"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { MdOutlineDarkMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <MdDarkMode />;

  if (resolvedTheme === "dark")
    return (
      <MdDarkMode
        className="cursor-pointer text-4xl text-white transition hover:text-[#e4212b]"
        onClick={() => setTheme("light")}
      />
    );

  if (resolvedTheme === "light")
    return (
      <MdOutlineDarkMode
        className="cursor-pointer text-4xl text-white transition hover:text-[#e4212b]"
        onClick={() => setTheme("dark")}
      />
    );
}
