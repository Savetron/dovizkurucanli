document.addEventListener('DOMContentLoaded', () => {
    // Hangi sayfada olduğumuzu kontrol et ve ilgili fonksiyonu çağır
    if (document.getElementById('blogPostList')) {
        loadBlogPosts(); // Blog listeleme sayfasındayız
    } else if (document.getElementById('blogPostContent')) {
        loadBlogPost(); // Tek blog yazısı sayfasındayız
    }
});

// Blog yazılarını listeleme fonksiyonu
async function loadBlogPosts() {
    const blogPostListElement = document.getElementById('blogPostList');
    if (!blogPostListElement) return; // Element yoksa çık

    blogPostListElement.innerHTML = '<p class="text-center">Yazılar yükleniyor...</p>'; // Yükleniyor mesajı

    try {
        // Blog indeks dosyasını çek
        const response = await fetch('../blog/index.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        // "Yükleniyor..." mesajını temizle
        blogPostListElement.innerHTML = '';

        if (!posts || posts.length === 0) {
            blogPostListElement.innerHTML = '<p class="text-center">Henüz blog yazısı bulunmuyor.</p>';
            return;
        }

        // Yazıları tarihe göre tersten sırala (en yeni en üstte)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Her yazı için bir kart oluştur
        posts.forEach(post => {
            const postCard = `
                <div class="col-md-6 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${post.title}</h5>
                            <p class="card-text text-muted"><small>${new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</small></p>
                            <p class="card-text">${post.summary}</p>
                            <a href="blog-sablonu.html?yazi=${post.slug}" class="btn btn-primary mt-auto align-self-start">Devamını Oku</a>
                        </div>
                    </div>
                </div>
            `;
            blogPostListElement.innerHTML += postCard;
        });

    } catch (error) {
        console.error('Blog yazıları yüklenirken hata oluştu:', error);
        blogPostListElement.innerHTML = '<p class="text-center text-danger">Blog yazıları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
    }
}

// Tek bir blog yazısını yükleme fonksiyonu
async function loadBlogPost() {
    const postTitleElement = document.getElementById('postTitle');
    const postDateElement = document.getElementById('postDate');
    const postBodyElement = document.getElementById('postBody');

    // Elementler yoksa veya marked kütüphanesi yüklenmemişse çık
    if (!postTitleElement || !postDateElement || !postBodyElement || typeof marked === 'undefined') {
        console.error('Gerekli elementler veya marked kütüphanesi bulunamadı.');
        if (postBodyElement) postBodyElement.innerHTML = '<p class="text-danger">Sayfa yüklenirken bir sorun oluştu.</p>';
        return;
    }

    postTitleElement.textContent = 'Yazı Yükleniyor...';
    postBodyElement.innerHTML = '<p>İçerik yükleniyor...</p>';

    try {
        // URL'den yazı slug'ını al
        const urlParams = new URLSearchParams(window.location.search);
        const postSlug = urlParams.get('yazi');

        if (!postSlug) {
            throw new Error('URL\'de yazı kimliği (slug) bulunamadı.');
        }

        // İndeks dosyasını çek ve yazı bilgilerini bul
        const indexResponse = await fetch('../blog/index.json');
        if (!indexResponse.ok) {
            throw new Error(`Blog indeksi yüklenemedi! Status: ${indexResponse.status}`);
        }
        const posts = await indexResponse.json();
        const postMeta = posts.find(p => p.slug === postSlug);

        if (!postMeta) {
            throw new Error(`'${postSlug}' kimliğine sahip yazı bulunamadı.`);
        }

        // Markdown dosyasını çek
        const markdownResponse = await fetch(`../blog/${postMeta.markdownFile}`);
        if (!markdownResponse.ok) {
            throw new Error(`Markdown dosyası yüklenemedi! Status: ${markdownResponse.status}`);
        }
        const markdownText = await markdownResponse.text();

        // Markdown'ı HTML'e çevir ve sayfaya yerleştir
        // Güvenlik notu: Eğer kullanıcıların Markdown girmesine izin verilecekse,
        // 'marked' kütüphanesinin sanitize seçeneği veya DOMPurify gibi ek
        // kütüphanelerle XSS saldırılarına karşı önlem alınmalıdır.
        // Şu anki yapıda sadece kendi yazdığımız .md dosyaları olduğu için risk daha düşük.
        postBodyElement.innerHTML = marked.parse(markdownText);

        // Başlık ve tarihi güncelle
        postTitleElement.textContent = postMeta.title;
        postDateElement.innerHTML = `<small>${new Date(postMeta.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</small>`;

        // Sayfa başlığını ve meta açıklamasını güncelle (SEO için önemli)
        document.title = `${postMeta.title} - Canlı Döviz Kuru`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', postMeta.summary || `${postMeta.title} - Canlı Döviz Kuru blog yazısı.`);
        }

    } catch (error) {
        console.error('Blog yazısı yüklenirken hata oluştu:', error);
        postTitleElement.textContent = 'Hata';
        postBodyElement.innerHTML = `<p class="text-center text-danger">Blog yazısı yüklenirken bir hata oluştu: ${error.message}. Lütfen <a href="blog.html">tüm yazılara dönün</a> veya sayfayı yenileyin.</p>`;
    }
}

// Tema değiştirme işlevselliği (script.js'deki mevcut tema fonksiyonlarının çalışacağını varsayıyoruz)
// Eğer script.js'de yoksa veya ayrı yönetmek isterseniz buraya ekleyebilirsiniz.