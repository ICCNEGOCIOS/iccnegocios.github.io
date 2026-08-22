/* ---------------- DATA ---------------- */
const CATEGORIES = [
  {id:'aceites', name:'Aceites de Motor', desc:'Diésel y gasolina, todos los grados', icon:'drop'},
  {id:'caja', name:'Aceites de Caja', desc:'Transmisión y diferencial', icon:'drop'},
  {id:'industrial', name:'Aceites Industriales', desc:'Hidráulicos ISO VG', icon:'gear'},
  {id:'grasas', name:'Grasas', desc:'Litio y calcio, para todo uso', icon:'bucket'},
  {id:'refrigerantes', name:'Refrigerantes', desc:'Anticongelante 50/50', icon:'snow'},
  {id:'urea', name:'Urea Automotriz', desc:'Para sistemas SCR diésel', icon:'flask'},
  // {id:'filtros', name:'Filtros', desc:'Aceite, aire y combustible', icon:'filter'},
  // {id:'bolsas', name:'Bolsas de Aire', desc:'Suspensión neumática y compatibles', icon:'wind'},
  // {id:'valvulas', name:'Válvulas', desc:'Válvulas y componentes de admisión', icon:'valve'},
  // {id:'accesorios', name:'Repuestos Varios', desc:'Bujías, mangueras y más', icon:'wrench'},
];

const ICONS = {
  drop:'<path d="M12 2s7 8.5 7 13a7 7 0 1 1-14 0c0-4.5 7-13 7-13z"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  filter:'<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  wind:'<path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/><path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/>',
  valve:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18" stroke-width="1.6"/>',
  snow:'<path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"/>',
  flask:'<path d="M9 2v6.2L4.2 17a2 2 0 0 0 1.8 3h12a2 2 0 0 0 1.8-3L15 8.2V2"/><path d="M8 2h8"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 1 0-5.66 5.66L2 19l3 3 6.96-7.04A4 4 0 0 0 17.7 9.3z"/>',
  bucket:'<path d="M4 7h16l-1.8 12.5a1.5 1.5 0 0 1-1.48 1.5H7.28a1.5 1.5 0 0 1-1.48-1.5L4 7z"/><path d="M2 7l2.8-4h14.4L22 7"/><path d="M9 11.5v5M15 11.5v5"/>'
};

function svgIcon(name, size=22){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

const BRANDS = [
  {id:'MOBIL', name:'Mobil', tag:'Lubricantes premium', color:'#0b3b6f', color2:'#159de0', file:'assets/brands/Logo Mobil.png'},
  {id:'CASTROL', name:'Castrol', tag:'Alto rendimiento', color:'#c8102e', color2:'#00693e', file:'assets/brands/Logo Castrol.png'},
  {id:'SHELL', name:'Shell', tag:'Tecnología de motor', color:'#dd1d21', color2:'#f5b400', file:'assets/brands/Logo Shell.png'},
  {id:'HYUNDAI XTEER', name:'Hyundai Xteer', tag:'Tecnología de motor', color:'#dd1d21', color2:'#f5b400', file:'assets/brands/Logo Hyundai.png'},
  {id:'VISTONY', name:'Vistony', tag:'Lubricante peruano', color:'#0d63ad', color2:'#07213f', file:'assets/brands/Logo Vistony.png'},
  {id:'VEXTROM', name:'Vextrom', tag:'Aceites y grasas', color:'#1a3a52', color2:'#2d5a8c', file:'assets/brands/Logo Vextrom.png'},
  {id:'VECSOL', name:'Vecsol', tag:'Aceites industriales', color:'#1e5f8c', color2:'#2d7ab3', file:'assets/brands/Logo Vecsol.png'},
  {id:'EVOLUBE', name:'Evo Lube', tag:'Aceites especializados', color:'#c41e3a', color2:'#ff6b35', file:'assets/brands/Logo Evolube.png'},
  {id:'AMERICAN', name:'American', tag:'Aceites automotrices', color:'#003c71', color2:'#1a5490', file:'assets/brands/Logo American.png'},
  {id:'AVAFREEZE', name:'Avafreeze', tag:'Refrigerantes', color:'#0f766e', color2:'#14b8a6', file:'assets/brands/Logo Avafreeze.png'},
  {id:'PEAK', name:'Peak', tag:'Refrigerantes premium', color:'#1f2937', color2:'#374151', file:'assets/brands/Logo Peak.png'},
  {id:'WILLIAMS', name:'Williams', tag:'Líquidos especiales', color:'#7c3aed', color2:'#a855f7', file:'assets/brands/Logo Williams.png'},
  {id:'PREXTOLINE', name:'Prextoline', tag:'Líquidos de frenos', color:'#dc2626', color2:'#991b1b', file:'assets/brands/Logo Prextoline.png'},
  {id:'FRENOSA', name:'Frenosa', tag:'Líquidos de frenos', color:'#7f1d1d', color2:'#be123c', file:'assets/brands/Logo Frenosa.png'},
  {id:'WOHLER', name:'Wohler', tag:'Urea automotriz', color:'#065f46', color2:'#059669', file:'assets/brands/Logo Wohler.png'},
  {id:'BLP_USA', name:'BLP USA', tag:'Bolsas y filtros', color:'#1e40af', color2:'#1d4ed8', file:'assets/brands/Logo BLP.png'},
  {id:'FLEETGUARD', name:'Fleetguard', tag:'Grasas industriales', color:'#b91c1c', color2:'#dc2626', file:'assets/brands/Logo Fleetguard.png'},
];

const PRODUCTS = [
  // ---- ACEITES DE MOTOR ----
  {id:'p1', name:'Aceite Motor 5W-30 Mobil Semisintético', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Galón', desc:'Aceite semisintético 5W-30 Mobil verde.',specs:[['Grado','5W-30'],['Tipo','Semisintético'],['Marca','Mobil'],['Presentación','Galón']], image: 'assets/products/p1.png'},
  {id:'p2', name:'Aceite Motor 5W-30 Mobil Sintético', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Galón', desc:'Aceite sintético 5W-30 Mobil.',specs:[['Grado','5W-30'],['Tipo','Sintético'],['Marca','Mobil'],['Presentación','Galón']], image: 'assets/products/p2.png'},
  {id:'p3', name:'Aceite Diésel 20W-50 Castrol GTX', brand:'CASTROL', cat:'aceites', icon:'drop', price:null, unit:'Galón', desc:'Aceite diésel 20W-50 Castrol GTX sintético.',specs:[['Grado','20W-50'],['Marca','Castrol'],['Presentación','Galón']], image: 'assets/products/p3.png'},
  {id:'p4', name:'Aceite Diésel 10W-40 Mobil', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 10W-40 Mobil en balde.',specs:[['Grado','10W-40'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p4.png'},
  {id:'p5', name:'Aceite Diésel 15W-40 Mobil Minibalde', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Minibalde', desc:'Aceite diésel 15W-40 Mobil minibalde tapa ploma.',specs:[['Grado','15W-40'],['Marca','Mobil'],['Presentación','Minibalde']], image: 'assets/products/p5.png'},
  {id:'p6', name:'Aceite Diésel 15W-40 Mobil Balde', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 15W-40 Mobil balde tapa ploma.',specs:[['Grado','15W-40'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p6.png'},
  {id:'p7', name:'Aceite Diésel 15W-40 Mobil CK-4 Cilindro', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Cilindro', desc:'Aceite diésel 15W-40 Mobil CK-4 cilindro.',specs:[['Grado','15W-40'],['Marca','Mobil'],['Presentación','Cilindro']], image: 'assets/products/p7.png'},
  {id:'p8', name:'Aceite Diésel 15W-40 Vextrom Balde', brand:'VEXTROM', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 15W-40 Vextrom balde.',specs:[['Grado','15W-40'],['Marca','Vextrom'],['Presentación','Balde']], image: 'assets/products/p8.png'},
  {id:'p9', name:'Aceite Diésel 15W-40 Vistony Balde', brand:'VISTONY', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 15W-40 Vistony balde.',specs:[['Grado','15W-40'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p9.png'},
  {id:'p10', name:'Aceite Diésel 20W-50 Vistony Cilindro', brand:'VISTONY', cat:'aceites', icon:'drop', price:null, unit:'Cilindro', desc:'Aceite diésel 20W-50 Vistony cilindro.',specs:[['Grado','20W-50'],['Marca','Vistony'],['Presentación','Cilindro']], image: 'assets/products/p10.png'},
  {id:'p11', name:'Aceite Diésel 25W-50 American Balde', brand:'AMERICAN', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-50 American balde.',specs:[['Grado','25W-50'],['Marca','American'],['Presentación','Balde']], image: 'assets/products/p11.png'},
  {id:'p12', name:'Aceite Diésel 25W-50 Mobil Balde', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-50 Mobil balde.',specs:[['Grado','25W-50'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p12.png'},
  {id:'p13', name:'Aceite Diésel 25W-50 Mobil Minibalde', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Minibalde', desc:'Aceite diésel 25W-50 Mobil minibalde.',specs:[['Grado','25W-50'],['Marca','Mobil'],['Presentación','Minibalde']], image: 'assets/products/p13.png'},
  {id:'p14', name:'Aceite Diésel 25W-50 Vecsol Balde', brand:'VECSOL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-50 Vecsol balde.',specs:[['Grado','25W-50'],['Marca','Vecsol'],['Presentación','Balde']], image: 'assets/products/p14.png'},
  {id:'p15', name:'Aceite Diésel 25W-50 Vextrom Balde', brand:'VEXTROM', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-50 Vextrom balde.',specs:[['Grado','25W-50'],['Marca','Vextrom'],['Presentación','Balde']], image: 'assets/products/p15.png'},
  {id:'p16', name:'Aceite Diésel 25W-60 Castrol Balde', brand:'CASTROL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-60 Castrol Viscus balde.',specs:[['Grado','25W-60'],['Marca','Castrol'],['Presentación','Balde']], image: 'assets/products/p16.png'},
  {id:'p17', name:'Aceite Diésel 25W-60 Mobil Balde', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-60 Mobil balde.',specs:[['Grado','25W-60'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p17.png'},
  {id:'p18', name:'Aceite Diésel 25W-60 Mobil Litro', brand:'MOBIL', cat:'aceites', icon:'drop', price:null, unit:'Litro', desc:'Aceite diésel 25W-60 Mobil litro.',specs:[['Grado','25W-60'],['Marca','Mobil'],['Presentación','Litro']], image: 'assets/products/p18.png'},
  {id:'p19', name:'Aceite Diésel 25W-60 Vecsol Balde', brand:'VECSOL', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-60 Vecsol balde.',specs:[['Grado','25W-60'],['Marca','Vecsol'],['Presentación','Balde']], image: 'assets/products/p19.png'},
  {id:'p20', name:'Aceite Diésel 25W-60 Vextrom Balde', brand:'VEXTROM', cat:'aceites', icon:'drop', price:null, unit:'Balde', desc:'Aceite diésel 25W-60 Vextrom balde.',specs:[['Grado','25W-60'],['Marca','Vextrom'],['Presentación','Balde']], image: 'assets/products/p20.png'},
  {id:'p21', name:'Aceite Hidráulico AW30 Vecsol Balde', brand:'VECSOL', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW30 Vecsol balde.',specs:[['Grado','AW30'],['Marca','Vecsol'],['Presentación','Balde']], image: 'assets/products/p21.png'},
  {id:'p22', name:'Aceite Hidráulico AW30 Mobil Balde', brand:'MOBIL', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW30 Mobil balde.',specs:[['Grado','AW30'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p22.png'},
  {id:'p23', name:'Aceite Hidráulico AW46 Hyundai Cilindro', brand:'HYUNDAI XTEER', cat:'industrial', icon:'gear', price:null, unit:'Cilindro', desc:'Aceite hidráulico AW46 cilindro.',specs:[['Grado','AW46'],['Marca','Hyundai Xteer'],['Presentación','Cilindro']], image: 'assets/products/p23.png'},
  {id:'p24', name:'Aceite Hidráulico AW50 Mobil Balde', brand:'MOBIL', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW50 Mobil balde.',specs:[['Grado','AW50'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p24.png'},
  {id:'p25', name:'Aceite Hidráulico AW50 Vecsol Balde', brand:'VECSOL', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW50 Vecsol balde.',specs:[['Grado','AW50'],['Marca','Vecsol'],['Presentación','Balde']], image: 'assets/products/p25.png'},
  {id:'p26', name:'Aceite Hidráulico AW68 EvoLube Balde', brand:'EVOLUBE', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW68 EvoLube balde.',specs:[['Grado','AW68'],['Marca','EvoLube'],['Presentación','Balde']], image: 'assets/products/p26.png'},
  {id:'p27', name:'Aceite Hidráulico AW68 Hyundai Cilindro', brand:'HYUNDAI XTEER', cat:'industrial', icon:'gear', price:null, unit:'Cilindro', desc:'Aceite hidráulico AW68 cilindro.',specs:[['Grado','AW68'],['Marca','Hyundai Xteer'],['Presentación','Cilindro']], image: 'assets/products/p27.png'},
  {id:'p28', name:'Aceite Hidráulico AW68 Hyundai Lata', brand:'HYUNDAI XTEER', cat:'industrial', icon:'gear', price:null, unit:'Lata', desc:'Aceite hidráulico AW68 lata.',specs:[['Grado','AW68'],['Marca','Hyundai'],['Presentación','Lata']], image: 'assets/products/p28.png'},
  {id:'p29', name:'Aceite Hidráulico AW68 Shell Balde', brand:'SHELL', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW68 Shell balde.',specs:[['Grado','AW68'],['Marca','Shell'],['Presentación','Balde']], image: 'assets/products/p29.png'},
  {id:'p30', name:'Aceite Hidráulico AW68 Mobil Balde', brand:'MOBIL', cat:'industrial', icon:'gear', price:null, unit:'Balde', desc:'Aceite hidráulico AW68 Mobil balde.',specs:[['Grado','AW68'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p30.png'},
  {id:'p32', name:'Aceite Caja 80W-90 Shell Balde', brand:'SHELL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite caja 80W-90 Shell balde.',specs:[['Grado','80W-90'],['Marca','Shell'],['Presentación','Balde']], image: 'assets/products/p32.png'},
  {id:'p33', name:'Aceite Caja 85W-140 Shell Balde', brand:'SHELL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite caja 85W-140 Shell balde.',specs:[['Grado','85W-140'],['Marca','Shell'],['Presentación','Balde']], image: 'assets/products/p33.png'},
  {id:'p34', name:'Aceite Caja 80W-90 Vistony Balde', brand:'VISTONY', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite caja 80W-90 Vistony balde.',specs:[['Grado','80W-90'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p34.png'},
  {id:'p35', name:'Aceite Caja 85W-140 Vistony Balde', brand:'VISTONY', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite caja 85W-140 Vistony balde.',specs:[['Grado','85W-140'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p35.png'},
  {id:'p36', name:'Aceite Caja 80W-90 Mobil Balde', brand:'MOBIL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite caja 80W-90 Mobil balde.',specs:[['Grado','80W-90'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p36.png'},
  {id:'p37', name:'Aceite Caja 85W-140 Mobil Balde', brand:'MOBIL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite caja 85W-140 Mobil balde.',specs:[['Grado','85W-140'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p37.png'},
  {id:'p38', name:'Grasa EP2 EvoLube Balde Azul', brand:'EVOLUBE', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa EP2 EvoLube balde azul.',specs:[['Tipo','EP2'],['Marca','EvoLube'],['Presentación','Balde']], image: 'assets/products/p38.png'},
  {id:'p39', name:'Grasa EP2 Vistony Balde Azul', brand:'VISTONY', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa EP2 Vistony balde azul.',specs:[['Tipo','EP2'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p39.png'},
  {id:'p40', name:'Grasa EP2 Vistony Balde Amarillo', brand:'VISTONY', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa EP2 Vistony balde amarillo.',specs:[['Tipo','EP2'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p40.png'},
  {id:'p41', name:'Grasa EP2 Mobil Balde Azul', brand:'MOBIL', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa EP2 Mobil balde azul.',specs:[['Tipo','EP2'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p41.png'},
  {id:'p42', name:'Grasa H2 Prextoline Balde Rojo', brand:'PREXTOLINE', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa H2 Prextoline balde rojo.',specs:[['Tipo','H2 Calcio'],['Marca','Prextoline'],['Presentación','Balde']], image: 'assets/products/p42.png'},
  {id:'p43', name:'Grasa H2 Vistony Balde Rojo', brand:'VISTONY', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa H2 Vistony balde rojo.',specs:[['Tipo','H2 Calcio'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p43.png'},
  {id:'p44', name:'Grasa Fleetguard Balde', brand:'FLEETGUARD', cat:'grasas', icon:'bucket', price:null, unit:'Balde', desc:'Grasa industrial Fleetguard balde.',specs:[['Tipo','Grasa industrial'],['Marca','Fleetguard'],['Presentación','Balde']], image: 'assets/products/p44.png'},
  {id:'p45', name:'Refrigerante 50/50 Avafreeze', brand:'AVAFREEZE', cat:'refrigerantes', icon:'snow', price:null, unit:'Balde', desc:'Refrigerante 50/50 Avafreeze balde.',specs:[['Concentración','50/50'],['Marca','Avafreeze'],['Presentación','Balde']], image: 'assets/products/p45.png'},
  {id:'p46', name:'Refrigerante 50/50 Shell Primax', brand:'SHELL', cat:'refrigerantes', icon:'snow', price:null, unit:'Balde', desc:'Refrigerante 50/50 Shell Primax balde.',specs:[['Concentración','50/50'],['Marca','Shell'],['Presentación','Balde']], image: 'assets/products/p46.png'},
  {id:'p47', name:'Refrigerante 33% Peak Galón', brand:'PEAK', cat:'refrigerantes', icon:'snow', price:null, unit:'Galón', desc:'Refrigerante 33% Peak galón.',specs:[['Concentración','33%'],['Marca','Peak'],['Presentación','Galón']], image: 'assets/products/p47.png'},
  {id:'p48', name:'Corona 80W-90 Vextrom Balde Rojo', brand:'VEXTROM', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite corona 80W-90 Vextrom balde rojo.',specs:[['Grado','80W-90'],['Marca','Vextrom'],['Presentación','Balde']], image: 'assets/products/p48.png'},
  {id:'p49', name:'Corona 80W-90 Vistony Balde Verde', brand:'VISTONY', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite corona 80W-90 Vistony balde verde.',specs:[['Grado','80W-90'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p49.png'},
  {id:'p50', name:'Corona 80W-90 Williams Balde Verde', brand:'WILLIAMS', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite corona 80W-90 Williams balde verde.',specs:[['Grado','80W-90'],['Marca','Williams'],['Presentación','Balde']], image: 'assets/products/p50.png'},
  {id:'p51', name:'Corona 80W-90 Shell Primax Balde', brand:'SHELL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite corona 80W-90 Shell Primax balde verde.',specs:[['Grado','80W-90'],['Marca','Shell'],['Presentación','Balde']], image: 'assets/products/p51.png'},
  {id:'p52', name:'ATF Vecsol Balde', brand:'VECSOL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite ATF Vecsol balde.',specs:[['Tipo','ATF'],['Marca','Vecsol'],['Presentación','Balde']], image: 'assets/products/p52.png'},
  {id:'p53', name:'ATF Vistony Balde', brand:'VISTONY', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite ATF Vistony balde.',specs:[['Tipo','ATF'],['Marca','Vistony'],['Presentación','Balde']], image: 'assets/products/p53.png'},
  {id:'p54', name:'ATF Tipo A Williams Balde', brand:'WILLIAMS', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite ATF Tipo A Williams balde.',specs:[['Tipo','ATF Tipo A'],['Marca','Williams'],['Presentación','Balde']], image: 'assets/products/p54.png'},
  {id:'p55', name:'ATF 220 Mobil Balde', brand:'MOBIL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite ATF 220 Mobil balde.',specs:[['Tipo','ATF 220'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p55.png'},
  {id:'p56', name:'Mobil Fluid 42 Balde', brand:'MOBIL', cat:'caja', icon:'drop', price:null, unit:'Balde', desc:'Aceite Mobil Fluid 42 balde.',specs:[['Tipo','Fluid 42'],['Marca','Mobil'],['Presentación','Balde']], image: 'assets/products/p56.png'},
  {id:'p57', name:'Líquido Frenos DOT3 -6 Frenosa Galón', brand:'FRENOSA', cat:'industrial', icon:'flask', price:null, unit:'Galón', desc:'Líquido frenos DOT3 -6 Frenosa galón.',specs:[['Especificación','DOT3 -6'],['Marca','Frenosa'],['Presentación','Galón']], image: 'assets/products/p57.png'},
  {id:'p60', name:'Urea Automotriz Wohler Balde', brand:'WOHLER', cat:'urea', icon:'flask', price:null, unit:'Balde', desc:'Urea automotriz Wohler balde.',specs:[['Tipo','Urea / AdBlue'],['Marca','Wohler'],['Presentación','Balde']], image: 'assets/products/p60.png'},
  {id:'p61', name:'Urea Automotriz BLP USA Bolsa', brand:'BLP_USA', cat:'urea', icon:'flask', price:null, unit:'Bolsa 4L', desc:'Urea automotriz BLP USA bolsa 4 litros.',specs:[['Tipo','Urea / AdBlue'],['Marca','BLP USA'],['Presentación','Bolsa 4 litros']], image: 'assets/products/p61.png'},
];

const ACTIVE_PROMOTIONS = [
  {
    id: 'evo-lube-aw68',
    label: 'Promoción del mes',
    title: 'Por la compra de 10 baldes de EVO LUBE AW68, llévate GRATIS un balde de EVO LUBE AW68 + 5 polos oficiales',
    text: 'Oferta vigente para compras de EVO LUBE AW68 en volumen. Incluye un balde extra de EVO LUBE AW68 y 5 polos oficiales como beneficio por la compra de 10 baldes.',
    terms: 'Válido mientras haya stock disponible. Consulta condiciones y disponibilidad vía WhatsApp.',
    image: 'assets/promos/promo.jpg'
  }
];

const PROMOS = {
  main:{
    title:'Hasta 20% OFF en aceites sintéticos + envío gratis desde S/150',
    badge:'Promoción del mes',
    desc:'Durante todo el mes, obtén hasta 20% de descuento en aceites sintéticos Mobil, Castrol y Shell seleccionados. Además, todo pedido desde S/150 incluye envío gratuito dentro de Lima Metropolitana.',
    items:[
      'Válido en compras dentro de la tienda online o por WhatsApp.',
      'Aplica sobre aceites sintéticos y semisintéticos seleccionados.',
      'Envío gratis en Lima Metropolitana para pedidos desde S/150.',
      'Sujeto a stock disponible al momento de la compra.'
    ],
    terms:'Promoción válida durante el mes en curso. ICC Negocios S.A.C. se reserva el derecho de modificar o finalizar la promoción sin previo aviso. Consulta stock y condiciones actualizadas por WhatsApp.'
  },
  p1:{ title:'2x1 en aditivos limpia-inyectores', badge:'Oferta especial',
    desc:'Lleva 2 aditivos limpia-inyectores Castrol o Mobil por el precio de 1. Ideal para mantenimiento preventivo antes del cambio de aceite.',
    items:['Aplica en la compra de 2 unidades del mismo producto.','Válido para aditivos limpia-inyectores seleccionados.','No acumulable con otras promociones.'],
    terms:'Promoción sujeta a disponibilidad de stock. Válida presentando este banner en tienda o mencionándolo por WhatsApp.'},
  p2:{ title:'Cambio de filtro gratis por 3 galones', badge:'Beneficio de taller',
    desc:'Al comprar 3 galones de aceite de motor de cualquier marca, llevas el filtro de aceite compatible totalmente gratis.',
    items:['Aplica en la compra de 3 galones del mismo tipo de aceite.','Filtro de regalo sujeto a disponibilidad de modelo.','Válido para retiro en tienda o coordinando delivery.'],
    terms:'Promoción válida mientras dure el stock de filtros. Consulta compatibilidad con tu asesor.'},
  p3:{ title:'Descuento especial para talleres y flotas', badge:'Precios corporativos',
    desc:'Si eres taller, lubricentro o administras una flota vehicular, accede a precios preferenciales por volumen de compra y facturación electrónica.',
    items:['Precios diferenciados según volumen mensual.','Atención con asesor comercial dedicado.','Coordinación de entregas programadas.'],
    terms:'Escríbenos por WhatsApp indicando el rubro de tu negocio para evaluar tu convenio comercial.'},
  p4:{ title:'Delivery gratis en pedidos desde S/150', badge:'Envío gratis',
    desc:'Todos los pedidos realizados desde la tienda online que superen los S/150 incluyen delivery gratuito dentro de Lima Metropolitana.',
    items:['Aplica automáticamente al superar el monto mínimo.','Entrega estimada de 24 a 48 horas.','Para provincias, el flete se cotiza aparte.'],
    terms:'Cobertura de envío gratuito limitada a distritos de Lima Metropolitana. Consulta tiempos exactos según tu zona.'}
};
