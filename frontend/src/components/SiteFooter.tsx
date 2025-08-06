export default function SiteFooter() {
    return (
        <footer
            style={{
                marginTop: 64,
                padding: '24px 0',
                textAlign: 'center',
                fontSize: 14,
                color: '#6b7280', // gray-500
                borderTop: '1px solid #e5e7eb', // light border
            }}
        >
        <p>
            Shipped with love for UW-Madison SAIL 2025
        </p>
        <p style={{ marginTop: 8 }}>
            By <a href="https://www.pramodna.com/">Pramod</a>, <a href="https://www.linkedin.com/in/tanvi-shukla-09a49424a">Tanvi</a>, and <a href="https://www.linkedin.com/in/samuel-lee-b4a9a61ab/">Sam</a>
        </p>
        </footer>
    )
}