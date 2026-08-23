"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FaInstagram, FaMapMarkerAlt, FaStar, FaClock, FaPhoneAlt, FaArrowLeft, FaArrowRight, FaCut } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function Home() {
  const pricing = [
    { name: "Strzyżenie włosów", price: "85" },
    { name: "Combo", price: "140" },
    { name: "Boki", price: "70" },
    { name: "Strzyżenie dziecka", price: "65" },
    { name: "Strzyżenie średnie włosy", price: "100+" },
    { name: "Strzyżenie brody", price: "70" },
    { name: "Ojciec + syn", price: "140" },
    { name: "Combo + odsiwianie", price: "170" },
    { name: "Combo średnie włosy", price: "160+" },
    { name: "Combo + syn", price: "190" },
    { name: "Odsiwianie brody/włosów", price: "45" },
  ];

  const googleReviews = [
    { name: "Kacper D.", date: "2 tygodnie temu", text: "Świetna atmosfera, a strzyżenie wykonane z ogromną precyzją. Najlepszy barber na Wildzie, polecam w 100%!", initial: "K" },
    { name: "Michał N.", date: "Miesiąc temu", text: "Super atmosfera, świetne strzyżenie i broda zrobiona idealnie. Pełen profesjonalizm. Na pewno wrócę.", initial: "M" },
    { name: "Tomasz K.", date: "2 miesiące temu", text: "Krótko i na temat - mistrzostwo. Chłopaki znają się na rzeczy. Termin z Booksy zrealizowany punktualnie.", initial: "T" },
    { name: "Adam W.", date: "3 tygodnie temu", text: "Wystrój i obsługa na najwyższym poziomie. Zdecydowanie polecam każdemu dżentelmenowi. Klasa.", initial: "A" },
    { name: "Dawid P.", date: "Tydzień temu", text: "Moje nowe stałe miejsce na mapie Poznania. Strzyżenie brody to czysta poezja i relaks.", initial: "D" },
    { name: "Piotr S.", date: "Miesiąc temu", text: "Od wejścia czuć klimat premium. Fryzura trzyma się idealnie, a doradztwo ze strony barbera bezcenne.", initial: "P" },
  ];

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      scrollRight();
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let requestRef: number;
    const handleScroll = () => {
      const containers = document.querySelectorAll('.parallax-container');
      containers.forEach(container => {
        const rect = container.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const children = container.querySelectorAll('.parallax-child');
          children.forEach(child => {
            const speed = parseFloat(child.getAttribute('data-speed') || '0.1');
            const yPos = (rect.top - window.innerHeight / 2) * speed;
            (child as HTMLElement).style.transform = `translateY(${yPos}px)`;
          });
        }
      });
    };

    const onScroll = () => {
      requestRef = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(requestRef);
    };
  }, []);

  useEffect(() => {
    const revealItems = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -80px 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans overflow-x-hidden selection:bg-kingsman-gold selection:text-black scroll-smooth">
      
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes barberPoleAnim {
          0% { background-position: 0 0; }
          100% { background-position: 84px 84px; }
        }
        .barber-pole-gold {
          background: repeating-linear-gradient(-45deg, #050505, #050505 20px, #D4AF37 20px, #D4AF37 40px, #111111 40px, #111111 60px);
          background-size: 84px 84px;
          animation: barberPoleAnim 3s linear infinite;
        }
        .gold-divider {
          background: linear-gradient(90deg, transparent, #D4AF37, transparent);
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
        .animate-shine {
          background-size: 200% auto;
          animation: shine 4s linear infinite;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .btn-razor {
          clip-path: polygon(
            15% 0%, 85% 0%, 
            100% 25%, 100% 75%, 
            85% 100%, 15% 100%, 
            0% 75%, 0% 25%
          );
        }
        .hex-shape {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }

        @keyframes identityFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
          50% { transform: translate3d(0, -14px, 0) rotate(1deg); }
        }
        @keyframes identityFloatReverse {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(1deg); }
          50% { transform: translate3d(0, 16px, 0) rotate(-1deg); }
        }
        @keyframes goldOrbit {
          0% { transform: rotate(0deg) scale(1); opacity: .45; }
          50% { transform: rotate(180deg) scale(1.08); opacity: .85; }
          100% { transform: rotate(360deg) scale(1); opacity: .45; }
        }
        @keyframes reviewShine {
          0% { transform: translateX(-120%) skewX(-18deg); }
          45%, 100% { transform: translateX(180%) skewX(-18deg); }
        }
        @keyframes identityScan {
          0%, 100% { transform: translateY(-110%); opacity: 0; }
          20% { opacity: .35; }
          55% { opacity: .18; }
          75% { opacity: 0; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes microPulse {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: .8; transform: scale(1.04); }
        }
        .identity-scan { animation: identityScan 7s ease-in-out infinite; }
        .micro-pulse { animation: microPulse 4s ease-in-out infinite; }
        .identity-float { animation: identityFloat 6s ease-in-out infinite; }
        .identity-float-reverse { animation: identityFloatReverse 7s ease-in-out infinite; }
        .gold-orbit { animation: goldOrbit 10s linear infinite; }
        .scroll-reveal { opacity: 0; transform: translateY(60px) scale(.98); filter: blur(8px); transition: opacity .9s ease, transform 1s cubic-bezier(.22,1,.36,1), filter .9s ease; }
        .scroll-reveal.is-visible { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        .scroll-reveal-delay-1 { transition-delay: .14s; }
        .scroll-reveal-delay-2 { transition-delay: .28s; }
        .review-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 25%, rgba(212,175,55,.16) 47%, transparent 62%); transform: translateX(-120%) skewX(-18deg); pointer-events: none; }
        .review-card:hover::before { animation: reviewShine 1.2s ease-out forwards; }
        .review-card { 
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 18px 50px rgba(0,0,0,.25);
          animation: reviewLiftIn .7s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes reviewLiftIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .review-card:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 25px 70px rgba(0,0,0,.4), 0 0 30px rgba(212,175,55,.08); }
        @media (prefers-reduced-motion: reduce) {
          .identity-float, .identity-float-reverse, .gold-orbit, .identity-scan, .micro-pulse { animation: none; }
          .scroll-reveal { opacity: 1; transform: none; filter: none; transition: none; }
        }
`}</style>

      {/* NAVBAR */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black via-black/90 to-transparent pt-6 pb-12 transition-all">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
          <Link href="/" className="relative z-10 w-20 h-20 group">
            <Image 
              src="/logo_nowe.png" 
              alt="Kingsman Logo" 
              fill 
              sizes="80px"
              className="object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" 
            />
          </Link>
          
          <nav className="hidden md:flex gap-12 text-sm font-bold tracking-[0.3em] uppercase text-gray-400">
            <a href="#about" className="hover:text-kingsman-gold hover:-translate-y-1 transition-transform">Agencja</a>
            <a href="#pricing" className="hover:text-kingsman-gold hover:-translate-y-1 transition-transform">Usługi</a>
            <a href="#gallery" className="hover:text-kingsman-gold hover:-translate-y-1 transition-transform">Archiwum</a>
          </nav>
          
          <a href="https://kingsmanbarbershop77.booksy.com" target="_blank" rel="noopener noreferrer" className="relative inline-flex items-center justify-center group cursor-pointer px-6 py-2.5 gold-bar bg-gradient-to-r from-yellow-600 via-kingsman-gold to-yellow-500 text-black font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="relative z-10 drop-shadow-sm">Zarezerwuj</span>
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[95vh] flex items-center justify-center [clip-path:polygon(0_0,100%_0,100%_85%,0_100%)] bg-black overflow-hidden group">
        <img
          src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?fm=jpg&q=60&w=3000&auto=format&fit=crop"
          alt="Gentleman"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-[15s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/50"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center mt-20 px-4 max-w-5xl">
          
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center cursor-default">
            <FaCut className="relative z-10 text-6xl md:text-7xl text-kingsman-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.9)] -rotate-90 hover:rotate-0 transition-transform duration-700 animate-pulse" />
          </div>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] leading-snug opacity-90 drop-shadow-2xl">
            <span className="text-gray-300">"Twój styl to </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-kingsman-gold via-yellow-200 to-kingsman-gold animate-shine">
              zbroja
            </span>
            <span className="text-gray-300"> współczesnego dżentelmena.</span>
            <br />
            <span className="text-sm md:text-xl text-gray-500 mt-6 block tracking-[0.2em] font-bold">
              A Kingsman to zbrojownia, w której wykuwamy ją na nowo."
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-10 opacity-80">
            <div className="w-12 md:w-24 h-px gold-divider"></div>
            <span className="text-kingsman-gold text-xl">♛</span>
            <div className="w-12 md:w-24 h-px gold-divider"></div>
          </div>
          
        </div>
      </section>

      {/* SEKCJA O NAS - ZDJĘCIA Z ODWROCONYM KIERUNKIEM WJEŻDŻANIA (GÓRNA Z DOŁU, DOLNA Z GÓRY) */}
      <section id="about" className="py-28 px-6 relative max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 parallax-container">
        <div className="w-full md:w-1/2 relative h-[620px] flex justify-center items-center">
          {/* Dekoracyjna geometria pozostaje poza ruchomą maską */}
          <div className="absolute w-72 h-72 md:w-[28rem] md:h-[28rem] rounded-full border border-kingsman-gold/15 gold-orbit"></div>
          <div className="absolute w-60 h-60 md:w-80 md:h-80 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)] bg-kingsman-gold/10 animate-[pulse_4s_infinite]"></div>
          <div className="absolute w-44 h-44 md:w-60 md:h-60 rounded-full bg-kingsman-gold/5 blur-3xl"></div>

          {/* Wspólny kadr = nic z poruszających się zdjęć nie wychodzi poza sekcję */}
          <div className="absolute inset-4 md:inset-0 overflow-hidden rounded-[2.2rem] border border-white/5 bg-black/20">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(212,175,55,.035)_50%,transparent_80%)]"></div>
            <div className="absolute left-1/2 top-1/2 w-[75%] h-px bg-gradient-to-r from-transparent via-kingsman-gold/25 to-transparent -translate-x-1/2"></div>
            <div className="absolute left-1/2 top-1/2 h-[75%] w-px bg-gradient-to-b from-transparent via-kingsman-gold/20 to-transparent -translate-y-1/2"></div>

            {/* Zdjęcie 01 */}
            <div className="absolute top-10 left-3 md:left-6 w-64 h-80 [clip-path:polygon(20%_0%,100%_0,80%_100%,0%_100%)] parallax-child z-20" data-speed="0.16">
              <div className="relative w-full h-full overflow-hidden border border-kingsman-gold/30 shadow-[0_20px_60px_rgba(0,0,0,.45)] identity-float">
                <img 
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
                  alt="Barber" 
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-kingsman-gold/10"></div>
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-kingsman-gold/10 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-gray-300">
                  <span>01 / RZEMIOSŁO</span><span className="text-kingsman-gold">Kingsman</span>
                </div>
              </div>
            </div>

            {/* Zdjęcie 02 */}
            <div className="absolute bottom-10 right-3 md:right-6 w-64 h-80 [clip-path:polygon(0_0,80%_0,100%_100%,20%_100%)] border-l-2 border-kingsman-gold/30 parallax-child z-10" data-speed="-0.16">
              <div className="relative w-full h-full overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.45)] identity-float-reverse">
                <Image 
                  src="/kreska.jpg" 
                  alt="Gentleman Accessories" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.28em] text-gray-400">02 / CHARAKTER</div>
              </div>
            </div>

            {/* Skan światła + środek kompozycji */}
            <div className="identity-scan pointer-events-none absolute inset-x-[8%] top-0 h-1/3 bg-gradient-to-b from-transparent via-kingsman-gold/20 to-transparent blur-md z-30"></div>
            <div className="micro-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-kingsman-gold/20 bg-black/35 backdrop-blur-sm z-30 flex items-center justify-center">
              <span className="text-kingsman-gold text-lg">♛</span>
            </div>

            <div className="absolute left-6 bottom-5 text-[9px] uppercase tracking-[0.35em] text-gray-600 z-40">
              IDENT. / 001
            </div>
            <div className="absolute right-6 top-5 text-[9px] uppercase tracking-[0.35em] text-gray-600 z-40">
              WILDA / POZNAŃ
            </div>
          </div>

          {/* Rama prowadząca wzrok */}
          <div className="absolute inset-6 md:inset-3 rounded-[2.2rem] border border-kingsman-gold/10 pointer-events-none z-40"></div>
        </div>

        <div className="w-full md:w-1/2 scroll-reveal scroll-reveal-delay-2">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-kingsman-gold text-xl">♦</span>
            <div className="w-16 h-[2px] bg-kingsman-gold"></div>
            <span className="text-[9px] uppercase tracking-[0.35em] text-gray-600">IDENTITY DEPT.</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-6 leading-tight text-gray-200">
            Tworzymy <br/><span className="text-kingsman-gold">Tożsamość</span>
          </h2>
          <div className="relative pl-5 border-l border-kingsman-gold/30">
          <p className="text-gray-400 font-light leading-relaxed text-lg mb-8">
            Nasza tajna baza na poznańskiej Wildzie to miejsce, w którym rzemiosło spotyka się z kinową elegancją. Wchodzisz tu jako mężczyzna, wychodzisz jako członek najbardziej elitarnego klubu w mieście.
          </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            
            <a href="#pricing" className="relative inline-flex items-center justify-center group cursor-pointer mt-2">
              <div className="absolute inset-0 bg-white btn-razor transition-transform duration-300 group-hover:scale-[1.05]"></div>
              <div className="absolute inset-[2px] bg-[#050505] btn-razor transition-colors duration-300 group-hover:bg-white flex items-center justify-center">
            </div>
              <span className="relative z-10 px-8 py-4 text-white group-hover:text-black font-black tracking-[0.2em] uppercase text-sm transition-colors duration-300">
                Poznaj usługi
              </span>
            </a>

            <span className="hidden sm:block text-gray-700 ml-2">|</span>
            <span className="text-gray-500 uppercase tracking-widest text-xs font-bold pt-1 italic sm:ml-2">
              "Oksfordy. Nie brogsy."
            </span>
          </div>
        </div>
      </section>

      <div className="h-2 w-full barber-pole-gold opacity-40"></div>

      {/* CENNIK */}
      <section id="pricing" className="py-32 relative bg-[#080808]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571104508999-893933ded431?q=80&w=2070&auto=format&fit=crop')] opacity-5 bg-fixed bg-cover mix-blend-luminosity"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <div className="flex items-center justify-center gap-4 mb-4 opacity-70">
              <div className="w-8 h-px gold-divider"></div>
              <span className="text-kingsman-gold text-lg">⚜</span>
              <div className="w-8 h-px gold-divider"></div>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-kingsman-gold via-yellow-200 to-kingsman-gold animate-pulse">
              Arsenał Usług
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-4">
            {pricing.map((item, index) => (
              <div 
                key={index} 
                className="group relative flex justify-between items-center p-6 hover:-translate-y-2 transition-all duration-500 cursor-default"
              >
                <div className="absolute inset-0 bg-kingsman-gold/10 [clip-path:polygon(0_10%,100%_0,95%_90%,5%_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex flex-col">
                  <span className="text-xl font-bold tracking-widest text-gray-300 group-hover:text-kingsman-gold transition-colors">{item.name}</span>
                  <span className="text-xs text-gray-600 uppercase tracking-[0.2em] mt-1 group-hover:text-gray-400">Standard Agencji</span>
                </div>
                
                <div className="relative z-10 flex items-center gap-4 shrink-0">
                  <div className="h-[1px] w-6 md:w-16 bg-gray-800 group-hover:bg-kingsman-gold transition-all duration-500"></div>
                  <span className="text-2xl font-black text-kingsman-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.2)] whitespace-nowrap">{item.price} <span className="text-sm text-gray-500">PLN</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REALIZACJE - DUŻE HEKSAGONY NACHODZĄCE NA SIEBIE Z PARALLAXEM */}
      <section id="gallery" className="py-32 px-6 bg-[#050505] overflow-hidden parallax-container">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left">
            <h2 className="text-3xl font-black uppercase tracking-[0.4em] text-gray-600">Klasyfikowane</h2>
            <h3 className="text-5xl font-black uppercase tracking-widest text-gray-200 mt-2">Akta wizualne</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:-space-x-12 justify-items-center items-center">
            
            {/* Heksagon 1 */}
            <div className="relative w-80 h-[450px] md:w-96 md:h-[520px] hex-shape bg-kingsman-gold p-[2px] group parallax-child hover:z-30 transition-transform duration-500 shadow-xl" data-speed="-0.08">
              <div className="w-full h-full hex-shape bg-black overflow-hidden relative">
                <Image 
                  src="/wlosy2.jpg" 
                  alt="Kingsman Cut 1" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                />
              </div>
            </div>

            {/* Heksagon 2 (Przesunięty wyżej) */}
            <div className="relative w-80 h-[450px] md:w-96 md:h-[520px] lg:-mt-20 hex-shape bg-kingsman-gold p-[2px] group parallax-child hover:z-30 transition-transform duration-500 shadow-xl" data-speed="0.12">
              <div className="w-full h-full hex-shape bg-black overflow-hidden relative">
                <Image 
                  src="/wlosy.jpg" 
                  alt="Kingsman Cut 2" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                />
              </div>
            </div>

            {/* Heksagon 3 */}
            <div className="relative w-80 h-[450px] md:w-96 md:h-[520px] hex-shape bg-kingsman-gold p-[2px] group parallax-child hover:z-30 transition-transform duration-500 shadow-xl" data-speed="-0.05">
              <div className="w-full h-full hex-shape bg-black overflow-hidden relative">
                <Image 
                  src="/wlosy3.jpeg" 
                  alt="Kingsman Cut 3" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                />
              </div>
            </div>

            {/* Heksagon 4 (Przesunięty wyżej) */}
            <div className="relative w-80 h-[450px] md:w-96 md:h-[520px] lg:-mt-20 hex-shape bg-kingsman-gold p-[2px] group parallax-child hover:z-30 transition-transform duration-500 shadow-xl" data-speed="0.09">
              <div className="w-full h-full hex-shape bg-black overflow-hidden relative">
                <Image 
                  src="/wlosy4.jpeg" 
                  alt="Kingsman Cut 4" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* OPINIE */}
      <section className="py-32 bg-[#0c0c0c] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70rem] h-[24rem] rounded-full border border-kingsman-gold/10 blur-[1px]"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-kingsman-gold/25 to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 scroll-reveal">
            <FcGoogle className="text-5xl md:text-6xl opacity-80" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-[0.32em] text-gray-600">Google / VERIFIED</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-kingsman-gold border border-kingsman-gold/20 rounded-full px-3 py-1">5.0 / 5</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-[0.2em] text-gray-200">Raporty agentów</h2>
            </div>
          </div>
          
          <div className="flex gap-4 scroll-reveal scroll-reveal-delay-1">
            <button onClick={scrollLeft} aria-label="Poprzednie opinie" className="w-14 h-14 border border-kingsman-gold/40 flex items-center justify-center text-kingsman-gold hover:bg-kingsman-gold hover:text-black transition-all duration-300">
              <FaArrowLeft className="text-xl" />
            </button>
            <button onClick={scrollRight} aria-label="Następne opinie" className="w-14 h-14 border border-kingsman-gold/40 flex items-center justify-center text-kingsman-gold hover:bg-kingsman-gold hover:text-black transition-all duration-300">
              <FaArrowRight className="text-xl" />
            </button>
          </div>
        </div>

        <div 
          ref={carouselRef}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 md:px-12 pb-10 max-w-[1400px] mx-auto"
        >
          {googleReviews.map((review, index) => (
            <div key={index} className="review-card group w-[85vw] md:w-[420px] min-h-[270px] shrink-0 snap-center bg-gradient-to-br from-[#171717] via-[#0f0f0f] to-[#0a0a0a] border border-white/5 p-7 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-kingsman-gold/60">
              <div className="absolute -top-16 -right-14 w-36 h-36 rounded-full border border-kingsman-gold/10 transition-transform duration-700 group-hover:scale-125"></div>
              <div className="absolute top-4 left-5 text-6xl leading-none font-serif text-kingsman-gold/10 select-none">“</div>
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 mb-7">
                  <div className="flex gap-1 text-kingsman-gold text-xs">{[0,1,2,3,4].map((star) => <FaStar key={star} className="drop-shadow-[0_0_8px_rgba(212,175,55,.25)]" />)}</div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-[0.18em] border border-white/10 rounded-full px-3 py-1">{review.date}</span>
                </div>
                <p className="text-gray-300 leading-relaxed font-serif italic text-[15px] md:text-base whitespace-normal mb-8">
                  “{review.text}”
                </p>
              </div>
              <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-kingsman-gold/25 to-black border border-kingsman-gold/40 text-kingsman-gold flex items-center justify-center font-black shadow-[0_0_18px_rgba(212,175,55,.08)]">
                    {review.initial}
                  </div>
                  <div>
                    <h4 className="font-bold uppercase tracking-[0.14em] text-gray-200 text-xs">{review.name}</h4>
                    <span className="text-[9px] text-gray-500 uppercase tracking-[0.18em]">Zweryfikowany klient</span>
                  </div>
                </div>
                <FcGoogle className="text-2xl opacity-50 group-hover:opacity-90 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8 relative z-10">
           <a href="https://www.google.com/search?q=Kingsman+Barbershop+Opinie" target="_blank" rel="noopener noreferrer" className="text-kingsman-gold hover:text-white text-sm tracking-[0.2em] uppercase font-bold transition-colors underline underline-offset-8">
             Przeglądaj pełne archiwum w Google
           </a>
        </div>
      </section>

      <div className="h-2 w-full barber-pole-gold opacity-40"></div>

      {/* FOOTER */}
      <footer id="contact" className="bg-[#030303] pt-24 pb-12 px-6 border-t border-[#111]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-gray-900 pb-16">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-56 h-32 relative mb-6">
              <Image src="/logo_szerokie.png" alt="Kingsman Barbershop" fill className="object-contain" />
            </div>
            <p className="text-gray-500 tracking-widest uppercase text-xs leading-loose">
              Klasyczny barbershop na Wildzie.<br/>
              Miejsce, gdzie rzemiosło spotyka się z nienagannym stylem.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-kingsman-gold font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FaClock /> Operacje
            </h4>
            <ul className="text-gray-400 text-sm tracking-widest uppercase space-y-4">
              <li className="flex justify-between w-48 border-b border-gray-800 pb-2">
                <span>Pon - Wt</span> <span className="text-gray-200">10:00 - 18:00</span>
              </li>
              <li className="flex justify-between w-48 border-b border-gray-800 pb-2">
                <span>Śr - Pt</span> <span className="text-gray-200">09:00 - 20:00</span>
              </li>
              <li className="flex justify-between w-48 border-b border-gray-800 pb-2">
                <span>Sobota</span> <span className="text-gray-200">09:00 - 15:00</span>
              </li>
              <li className="flex justify-between w-48 text-gray-600">
                <span>Niedziela</span> <span>Zamknięte</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-kingsman-gold font-black uppercase tracking-[0.2em] mb-6">Współrzędne</h4>
            <ul className="text-gray-400 text-sm tracking-widest uppercase space-y-4">
              <li>
                <a href="https://maps.google.com/?q=Różana+6+Poznań" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-kingsman-gold transition-colors">
                  <FaMapMarkerAlt className="text-kingsman-gold" /> Różana 6, 61-577 Poznań
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/kingsman_barbershop_poznan/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-kingsman-gold transition-colors">
                  <FaInstagram className="text-kingsman-gold" /> @kingsman_barbershop
                </a>
              </li>
              <li className="flex items-center gap-3 hover:text-kingsman-gold transition-colors cursor-pointer">
                 <FaPhoneAlt className="text-kingsman-gold" /> +48 123 456 789 
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-kingsman-gold font-black uppercase tracking-[0.2em] mb-6">Inicjacja</h4>
            <p className="text-gray-500 tracking-widest uppercase text-xs mb-6 text-center md:text-left">
              Zarezerwuj swój czas w fotelu z wyprzedzeniem.
            </p>
            
            <a href="https://kingsmanbarbershop77.booksy.com" target="_blank" rel="noopener noreferrer" className="relative inline-flex items-center justify-center group cursor-pointer w-full mt-2">
              <div className="absolute inset-0 bg-white btn-razor transition-transform duration-300 group-hover:scale-[1.03]"></div>
              <div className="absolute inset-[2px] bg-[#050505] btn-razor transition-colors duration-300 group-hover:bg-white flex items-center justify-center">
              </div>
              <span className="relative z-10 px-8 py-4 text-white group-hover:text-black font-black tracking-[0.3em] uppercase text-xs transition-colors duration-300">
                Wejdź do bazy
              </span>
            </a>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mt-8 text-[10px] text-gray-600 tracking-[0.3em] uppercase">
          <p>&copy; {new Date().getFullYear()} Kingsman Barbershop Poznań.</p>
          <p className="mt-2 md:mt-0">Dokumenty Ściśle Tajne.</p>
        </div>
      </footer>
    </main>
  );
}