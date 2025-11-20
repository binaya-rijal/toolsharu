import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t bg-background/50 backdrop-blur-sm">
            <p>
                Made with ❤️ by{" "}
                <Link
                    href="https://binaya-rijal.com.np/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors cursor-pointer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    Binaya
                </Link>
            </p>
        </footer>
    );
}
