import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Settings, ShoppingCart, Minus, Plus, ChevronRight, MapPin, CheckCircle2, Send, Trash2, PlayCircle } from "lucide-react";
import * as Ably from 'ably';

// 🌟 [설정] 여기에 사장님의 Ably API Key를 넣으세요
const ABLY_API_KEY = "XjmF8g.ulVdrw:4nkXLabLyp8QeStXaES3rfZyxNTG5HS4GXNJBUdU0aU"; 

const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const CAMPING_LAT = 37.571234; 
const CAMPING_LON = 127.422092; 
const ALLOWED_RADIUS = 120; 

const translations = {
  ko: { title: "LAZYJOE 매점", placeholder: "내용 입력 필수 (예: 냅킨 갖다 주세요)", button: "사장님 호출", setting_placeholder: "룸 번호 입력 (예: F2, C1)", success: "전달 완료!", geo_fail: "구역 외 지역입니다.", geo_error: "위치 확인 중...", label: "🇰🇷 KO", ack: "확인했습니다!" },
  en: { title: "LAZYJOE STORE", placeholder: "Required (e.g. Please bring napkins)", button: "Call Staff", setting_placeholder: "Enter Room No. (e.g. F2, C1)", success: "Sent!", geo_fail: "Out of range.", geo_error: "Locating...", label: "🇺🇸 EN", ack: "Confirmed!" },
  ru: { title: "МАГАЗИН LAZYJOE", placeholder: "Напишите (напр. Принесите салфетки)", button: "Вызвать администратора", setting_placeholder: "Введите номер (напр. F2, C1)", success: "Отправлено!", geo_fail: "Вне зоны.", geo_error: "Определяем...", label: "🇷🇺 RU", ack: "Принято!" }
};

// 🌟 [고정] 메뉴 데이터
const menuItems = [
  // DRINK
  { id: "water_2l", name: "생수 2L", nameEn: "Mineral Water 2L", nameRu: "Минеральная вода 2л", price: "1,500", image: "attached_assets/water_2l.jpg", category: "DRINK" },
  { id: "water_500", name: "생수 500ml", nameEn: "Mineral Water 500ml", nameRu: "Минеральная вода 500мл", price: "1,000", image: "attached_assets/water_500.jpg", category: "DRINK" },
  { id: "pepsi", name: "펩시콜라 355ml", nameEn: "Pepsi 355ml", nameRu: "Пепси 355мл", price: "2,000", image: "attached_assets/pepsi.jpg", category: "DRINK" },
  { id: "sprite", name: "스프라이트 215ml", nameEn: "Sprite 215ml", nameRu: "Спрайт 215мл", price: "1,500", image: "attached_assets/sprite.jpg", category: "DRINK" },
  { id: "fanta", name: "환타 215ml", nameEn: "Fanta 215ml", nameRu: "Фанта 215мл", price: "1,500", image: "attached_assets/fanta.jpg", category: "DRINK" },
  { id: "coke", name: "코카콜라 215ml", nameEn: "Coca-Cola 215ml", nameRu: "Кока-Кола 215мл", price: "1,500", image: "attached_assets/coke.jpg", category: "DRINK" },
  { id: "pepsi_zero", name: "제로펩시 라임 500ml", nameEn: "Zero Pepsi Lime 500ml", nameRu: "Зеро Пепси Лайм 500мл", price: "2,000", image: "attached_assets/pepsi_zero.jpg", category: "DRINK" },
  { id: "caprisun", name: "카프리썬", nameEn: "Capri Sun", nameRu: "Капри Сан", price: "2,000", image: "attached_assets/caprisun.jpg", category: "DRINK" },
  { id: "pororo", name: "뽀로로", nameEn: "Pororo Juice", nameRu: "Пороро Джус", price: "1,500", image: "attached_assets/pororo.jpg", category: "DRINK" },
  { id: "cider", name: "사이다 215ml", nameEn: "Cider 215ml", nameRu: "Сайдер 215мл", price: "1,500", image: "attached_assets/cider.jpg", category: "DRINK" },
  { id: "sikhye", name: "비락식혜", nameEn: "Birak Sikhye", nameRu: "Бирак Сикхе", price: "1,500", image: "attached_assets/sikhye.jpg", category: "DRINK" },
  // MEAL
  { id: "rice", name: "햇반", nameEn: "Hetbahn (Instant Rice)", nameRu: "Хэтбан (Рис)", price: "2,000", image: "attached_assets/rice.jpg", category: "MEAL" },
  { id: "ramen_shin", name: "한강라면 신라면", nameEn: "Shin Ramen", nameRu: "Шин Рамён", price: "4,000", image: "attached_assets/ramen_shin.jpg", category: "MEAL" },
  { id: "ramen_jin_m", name: "한강라면 진라면(순)", nameEn: "Jin Ramen (Mild)", nameRu: "Джин Рамён (Мягкий)", price: "4,000", image: "attached_assets/ramen_jin_m.jpg", category: "MEAL" },
  { id: "ramen_jin_s", name: "한강라면 진라면(매)", nameEn: "Jin Ramen (Spicy)", nameRu: "Джин Рамён (Острый)", price: "4,000", image: "attached_assets/ramen_jin_s.jpg", category: "MEAL" },
  { id: "ramen_neoguri", name: "한강라면 너구리", nameEn: "Neoguri Ramen", nameRu: "Неогури Рамён", price: "4,000", image: "attached_assets/ramen_neoguri.jpg", category: "MEAL" },
  { id: "ramen_jjapa", name: "한강라면 짜파게티", nameEn: "Jjapagetti", nameRu: "Чапагетти", price: "4,000", image: "attached_assets/ramen_jjapa.jpg", category: "MEAL" },
  { id: "tteokbokki", name: "미미네 국물떡볶이", nameEn: "Tteokbokki", nameRu: "Ттокпокки", price: "8,500", image: "attached_assets/tteokbokki.jpg", category: "MEAL",soldOut: true },
  { id: "cup_ramen", name: "컵라면", nameEn: "Cup Ramen", nameRu: "Кап Рамён", price: "2,000", image: "attached_assets/cup_ramen.jpg", category: "MEAL" },
  { id: "carbo_buldak", name: "까르보 불닭 작은컵", nameEn: "Carbo Buldak", nameRu: "Карбо Бульдак", price: "2,000", image: "attached_assets/carbo_buldak.jpg", category: "MEAL" },
  { id: "cheese_tteok", name: "치즈 떡볶이 컵", nameEn: "Cheese Tteokbokki Cup", nameRu: "Чиз Ттокпокки Кап", price: "2,500", image: "attached_assets/cheese_tteok.jpg", category: "MEAL" },
  // ALCOHOL
  { id: "cass_zero", name: "카스제로 355ml", nameEn: "Cass Zero", nameRu: "Касс Зеро", price: "3,000", image: "attached_assets/cass_zero.jpg", category: "ALCOHOL" },
  { id: "cass", name: "카스 454ml", nameEn: "Cass 454ml", nameRu: "Касс 454мл", price: "4,500", image: "attached_assets/cass.jpg", category: "ALCOHOL" },
  { id: "kelly", name: "켈리 355ml", nameEn: "Kelly 355ml", nameRu: "Келли 355мл", price: "3,500", image: "attached_assets/kelly.jpg", category: "ALCOHOL" },
  { id: "terra_355", name: "테라 355ml", nameEn: "Terra 355ml", nameRu: "Терра 355мл", price: "3,500", image: "attached_assets/terra_355.jpg", category: "ALCOHOL" },
  { id: "terra_453", name: "테라 453ml", nameEn: "Terra 453ml", nameRu: "Терра 453мл", price: "4,500", image: "attached_assets/terra_453.jpg", category: "ALCOHOL" },
  { id: "highball_g", name: "짐빔하이볼 자몽", nameEn: "Jim Beam Grapefruit", nameRu: "Джим Бим Грейпфрут", price: "4,500", image: "attached_assets/highball_g.jpg", category: "ALCOHOL" },
  { id: "highball_l", name: "짐빔하이볼 레몬", nameEn: "Jim Beam Lemon", nameRu: "Джим Бим Лимон", price: "4,500", image: "attached_assets/highball_l.jpg", category: "ALCOHOL" },
  // CAFE
  { id: "coffee_hot", name: "아메리카노 HOT", nameEn: "Americano (Hot)", nameRu: "Американо (Горячий)", price: "3,500", image: "attached_assets/coffee_hot.jpg", category: "CAFE" },
  { id: "coffee_ice", name: "아메리카노 ICE", nameEn: "Americano (Ice)", nameRu: "Американо (Айс)", price: "4,000", image: "attached_assets/coffee_ice.jpg", category: "CAFE" },
  { id: "choco_hot", name: "핫초코", nameEn: "Hot Chocolate", nameRu: "Хот Чоко", price: "3,500", image: "attached_assets/choco_hot.jpg", category: "CAFE" },
  { id: "choco_ice", name: "아이스초코", nameEn: "Ice Chocolate", nameRu: "Айс Чоко", price: "4,000", image: "attached_assets/choco_ice.jpg", category: "CAFE" },
  // BBQ
  { id: "pork_neck", name: "이베리코 목살 200g", nameEn: "Iberico Pork Neck 200g", nameRu: "Иберико Порк Нек 200г", price: "15,000", image: "attached_assets/pork_neck.jpg", category: "BBQ" },
  { id: "pork_ribs", name: "이베리코 갈빗살 200g", nameEn: "Iberico Pork Ribs 200g", nameRu: "Иберико Порк Рибс 200г", price: "18,000", image: "attached_assets/pork_ribs.jpg", category: "BBQ" },
  { id: "pork_belly", name: "한돈 삼겹살 400g", nameEn: "Pork Belly 400g", nameRu: "Порк Белли 400г", price: "20,000", image: "attached_assets/pork_belly.jpg", category: "BBQ" },
  { id: "ssamjang", name: "쌈장", nameEn: "Ssamjang", nameRu: "Ссамджанг", price: "2,500", image: "attached_assets/ssamjang.jpg", category: "BBQ" },
  { id: "vegetable", name: "깻잎 상추 세트", nameEn: "Vegetable Set", nameRu: "Веджетабл Сет", price: "3,500", image: "attached_assets/vegetable.jpg", category: "BBQ" },
  { id: "chili_garlic", name: "고추 마늘 세트", nameEn: "Chili & Garlic Set", nameRu: "Чили и Чеснок Сет", price: "1,000", image: "attached_assets/chili_garlic.jpg", category: "BBQ" },
  { id: "salt_set", name: "소금, 쌈장 세트", nameEn: "Salt & Ssamjang Set", nameRu: "Соль и Ссамджанг Сет", price: "1,000", image: "attached_assets/salt_set.jpg", category: "BBQ" },
  // RENTAL
  { id: "grill", name: "웨버 가스그릴", nameEn: "Weber Gas Grill", nameRu: "Вебер Газ Гриль", price: "35,000", image: "attached_assets/grill.jpg", category: "RENTAL" },
  { id: "burner_set", name: "강염버너 그리들 세트", nameEn: "Burner & Griddle Set", nameRu: "Бёрнер и Гриддл Сет", price: "25,000", image: "attached_assets/burner_set.jpg", category: "RENTAL" },
  { id: "towel", name: "바스타올", nameEn: "Bath Towel", nameRu: "Бас Таол (Полотенце)", price: "5,000", image: "attached_assets/towel.jpg", category: "RENTAL" },
  // ETC
  { id: "firewood", name: "참나무 장작", nameEn: "Oak Firewood", nameRu: "Ок Файервуд (Дрова)", price: "12,000", image: "attached_assets/firewood.jpg", category: "ETC" },
  { id: "marshmallow", name: "마시멜로", nameEn: "Marshmallows", nameRu: "Маршмэллоу", price: "3,000", image: "attached_assets/marshmallow.jpg", category: "ETC" }
];

export default function CampingStore() {
  const [tentId, setTentId] = useState(localStorage.getItem("tent_id") || ""); 
  const [tempTentId, setTempTentId] = useState(localStorage.getItem("tent_id") || "");
  const [isOwner, setIsOwner] = useState(localStorage.getItem("user_mode") === "owner");
  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem("order_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [lang, setLang] = useState<keyof typeof translations>('ko');
  const [showSettings, setShowSettings] = useState(false);
  const [guestMessage, setGuestMessage] = useState("");
  const [channel, setChannel] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lon: number} | null>(null);
  const [isLocating, setIsLocating] = useState(true); // 위치 정보 로딩 상태
  const [ackNotice, setAckNotice] = useState<string | null>(null); 
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[lang];

  const getItemName = (item: any) => {
    if (lang === 'en') return item.nameEn;
    if (lang === 'ru') return item.nameRu;
    return item.name;
  };

  useEffect(() => {
    if (!localStorage.getItem("tent_id") && !isOwner) setShowSettings(true);
  }, [isOwner]);

  // 위치 추적 로직 (권한 요청 포함)
  useEffect(() => {
    if (isOwner) return;
    setIsLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        console.error("위치 에러:", err);
        setIsLocating(false);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOwner]);

  // Ably 연결 로직 (고정 키 사용)
  useEffect(() => {
    if (!ABLY_API_KEY) return;
    const client = new Ably.Realtime(ABLY_API_KEY);
    const chan = client.channels.get('lazyjoe-call');
    setChannel(chan);
    return () => client.close();
  }, []);

  useEffect(() => {
    if (!channel) return;
    const sub = (message: any) => {
      if (message.name === 'call' && isOwner) {
        const newMsg = { id: message.id, completed: false, ...message.data };
        setMessages(prev => {
          const updated = [newMsg, ...prev];
          localStorage.setItem("order_history", JSON.stringify(updated));
          return updated;
        });
        if (audioRef.current) audioRef.current.play().catch(() => {});
      } else if (message.name === 'ack' && !isOwner) {
        if (message.data.targetTent === tentId) {
          setAckNotice(t.ack);
          setTimeout(() => setAckNotice(null), 4000);
        }
      }
    };
    channel.subscribe(sub);
    return () => channel.unsubscribe();
  }, [isOwner, channel, tentId, t.ack]);

  const saveSettings = () => {
    if(!tempTentId) return;
    setTentId(tempTentId);
    localStorage.setItem("tent_id", tempTentId);
    setShowSettings(false);
  };

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const canOrder = totalCartCount > 0 || guestMessage.trim().length > 0;

  const handleOrder = async () => {
    if (!canOrder) return;
    const currentTentId = localStorage.getItem("tent_id") || tentId;
    if (!currentTentId) { setShowSettings(true); return; }

    // 🌟 [수정] 'COUNTER' 또는 '매점'인 경우 위치 체크 제외
    const isNoLocationCheck = 
      currentTentId.toUpperCase() === "COUNTER" || 
      currentTentId === "매점" || 
      currentTentId.toUpperCase() === "SHOP";

    if (!isNoLocationCheck) {
      if (isLocating || !currentCoords) { 
        alert("위치 정보를 확인 중입니다. 잠시만 기다려주세요."); 
        return; 
      }
      const dist = getDistance(CAMPING_LAT, CAMPING_LON, currentCoords.lat, currentCoords.lon);
      if (dist > ALLOWED_RADIUS) { 
        alert(`${t.geo_fail} (${Math.round(dist)}m)`); 
        return; 
      }
    }

    // 🌟 [수정] 사장님께는 무조건 한국어 이름으로 전송되도록 로직 변경
    const cartSummary = Object.entries(cart)
      .filter(([_, q]) => q > 0)
      .map(([id, qty]) => {
        const item = menuItems.find(m => m.id === id);
        return `${item.name}(${qty})`; // getItemName 대신 item.name(한국어) 사용
      }).join(", ");

    try {
      await channel.publish('call', { 
        tent: currentTentId,
        order: cartSummary,
        request: guestMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      });
      setCart({}); setGuestMessage(""); alert(t.success);
    } catch (err) { 
      alert("전송 실패! 인터넷이나 API 키를 확인해주세요."); 
    }
  };
  
  const toggleComplete = (id: string) => {
    setMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
      localStorage.setItem("order_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllMessages = () => {
    if (window.confirm("오늘의 모든 기록을 삭제하시겠습니까?")) {
      setMessages([]);
      localStorage.removeItem("order_history");
    }
  };

  const sendTestCall = async () => {
    if (!channel) return;
    await channel.publish('call', { 
      tent: "TEST",
      order: "테스트 상품(1)",
      request: "테스트 호출입니다.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFCFB] text-[#2D2D2D] pb-44 font-sans overflow-x-hidden">
      <audio ref={audioRef} src={ALERT_SOUND_URL} />
      <AnimatePresence>
        {ackNotice && (
          <motion.div initial={{ y: -100, x: "-50%" }} animate={{ y: 20 }} exit={{ y: -100 }} className="fixed top-20 left-1/2 z-[100] bg-[#4ADE80] text-white px-10 py-4 rounded-full shadow-2xl font-black flex items-center gap-3 border border-white/30 whitespace-nowrap">
            <CheckCircle2 size={20} className="shrink-0" /> 
            <span className="text-[17px] tracking-tight">{tentId}님, {ackNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-[#1A1A1A] text-white px-6 py-5 shadow-2xl rounded-b-[35px]">
        <div className="flex justify-between items-center max-w-2xl mx-auto w-full">
          <div className="text-left"><h1 className="text-2xl font-light tracking-[0.3em]">LAZYJOE</h1><p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">Premium Stay</p></div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-xl gap-1">
              {['ko', 'en', 'ru'].map((l) => (
                <button key={l} onClick={() => setLang(l as any)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === l ? 'bg-orange-500 text-white' : 'text-white/40'}`}>
                  {translations[l as keyof typeof translations].label.split(' ')[0]}
                </button>
              ))}
            </div>
            <button onClick={() => { setTempTentId(tentId); setShowSettings(true); }} className="p-2 text-white/40"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8">
        {!isOwner ? (
          <div className="grid grid-cols-2 gap-4 text-left">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-[30px] overflow-hidden shadow-sm border border-stone-100 flex flex-col transition-all active:scale-95">
                <div className="aspect-square bg-white flex items-center justify-center p-2"><img src={item.image} alt={item.name} className="w-full h-full object-contain" /></div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-bold text-[13px] text-stone-700 leading-tight mb-1 min-h-[2.5rem]">{getItemName(item)}</p>
                  <p className="text-orange-600 font-black text-xs mb-3">₩{item.price}</p>
                  <div className="mt-auto flex items-center justify-between bg-stone-50 rounded-xl p-1">
                    <button className="w-8 h-8 flex items-center justify-center font-bold" onClick={() => { if(cart[item.id] > 0) setCart({...cart, [item.id]: cart[item.id]-1}) }}><Minus size={16}/></button>
                    <span className="font-bold text-sm">{cart[item.id] || 0}</span>
                    <button className="w-8 h-8 flex items-center justify-center" onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})}><Plus size={16} className="text-orange-500"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-6 text-left pb-20">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-black flex items-center gap-2"><Bell className="text-orange-500 animate-pulse" /> 호출 현황</h2>
               <div className="flex gap-2">
                  <button onClick={sendTestCall} className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95"><PlayCircle size={14}/> 테스트</button>
                  <button onClick={clearAllMessages} className="flex items-center gap-1 px-3 py-2 bg-stone-200 text-stone-600 rounded-xl text-xs font-bold shadow-md active:scale-95"><Trash2 size={14}/> 초기화</button>
               </div>
            </div>
            {messages.length === 0 && <div className="py-20 text-center text-stone-300 font-bold">내역이 없습니다.</div>}
            {messages.map((msg, i) => (
              <div key={i} className={`bg-white rounded-[30px] shadow-xl border border-stone-100 overflow-hidden mb-4 ${msg.completed ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                <div className="bg-stone-50 px-6 py-4 flex justify-between items-center">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-black italic">No. {msg.tent}</span>
                  <button onClick={() => toggleComplete(msg.id)} className={`p-2 ${msg.completed ? 'text-green-500' : 'text-stone-300'}`}><CheckCircle2 size={32} /></button>
                </div>
                <div className="p-6 space-y-4 text-left">
                  {msg.order && (<div><p className="text-[11px] font-black text-stone-400">주문</p><p className="text-lg font-bold text-stone-800">{msg.order}</p></div>)}
                  {msg.request && (<div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100"><p className="text-md font-black text-blue-700">"{msg.request}"</p></div>)}
                  {!msg.completed && (
                    <button onClick={async () => { await channel.publish('ack', { targetTent: msg.tent }); toggleComplete(msg.id); }} className="w-full h-14 bg-[#1A1A1A] text-white rounded-2xl text-[13px] font-black flex items-center justify-center gap-2">확인 메시지 보내기</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {!isOwner && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50">
          <div className="bg-[#1A1A1A] rounded-[30px] p-4 shadow-2xl">
            <input className="w-full h-12 px-6 rounded-xl mb-3 outline-none text-[14px] font-bold bg-white/10 text-white" placeholder={t.placeholder} value={guestMessage} onChange={(e) => setGuestMessage(e.target.value)} />
            <button disabled={!canOrder} onClick={handleOrder} className={`w-full h-16 rounded-[22px] font-black flex items-center justify-between px-5 transition-all ${canOrder ? 'bg-orange-500 text-white active:scale-95' : 'bg-stone-700 text-stone-500 opacity-50'}`}>
              <div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-3 relative">
                <ShoppingCart size={20} />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1A1A1A]">{totalCartCount}</span>
                )}
                <span className="text-[14px] font-black ml-1">{tentId}</span>
              </div>
              <span className="flex-1 text-center font-black tracking-tighter text-[17px]">{t.button}</span>
              <ChevronRight size={18} className="opacity-40 shrink-0" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="bg-white w-full max-w-sm rounded-[40px] p-10 space-y-6 text-center">
              <MapPin className="mx-auto text-orange-500" size={32} />
              <input className="w-full border-2 border-stone-100 rounded-2xl h-16 px-5 font-bold outline-none text-center text-lg text-black" placeholder={t.setting_placeholder} value={tempTentId} onChange={(e) => setTempTentId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveSettings()} />
              <button onClick={saveSettings} className="w-full h-16 bg-orange-500 text-white rounded-2xl font-black shadow-lg">설정 완료</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button className="fixed bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-stone-300 opacity-20" onClick={() => { const mode = isOwner ? "guest" : "owner"; setIsOwner(!isOwner); localStorage.setItem("user_mode", mode); }}>MODE SWITCH</button>
    </div>
  );
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default App;
