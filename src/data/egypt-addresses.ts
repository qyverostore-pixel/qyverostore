export type City = {
  name: string;
  shippingCost: number;
  estimatedDays: string;
};

export type Governorate = {
  name: string;
  nameAr?: string;
  cities: City[];
};

const cities = (names: string[]): City[] => names.map((name) => ({ name, shippingCost: 0, estimatedDays: "1-3" }));

export const egyptGovernorates: Governorate[] = [
  { name: "Cairo", cities: cities(["New Cairo", "Shorouk", "Badr", "Heliopolis", "Nasr City", "Maadi", "Helwan", "Mokattam", "Shubra", "El Zaytoun", "El Matareya", "Ain Shams", "El Marg", "El Salam", "Nozha", "Old Cairo", "Basateen", "Dar El Salam", "Sayeda Zeinab", "El Khalifa", "Downtown Cairo", "Abdeen", "Mousky", "Bulaq", "Amiriya", "Hadayek El Kobba", "El Zawya El Hamra", "El Sharabeya", "El Sahel", "Rod El Farag"]) },
  { name: "Giza", cities: cities(["Giza", "Dokki", "Agouza", "Mohandessin", "Haram", "Faisal", "Bulaq El Dakrour", "6th of October", "Sheikh Zayed", "Hawamdia", "Badrasheen", "Ayyat", "Saf", "Atfih", "Abu Nomros", "Kerdasa", "Oseem", "Manshiyat Al Qanater"]) },
  { name: "Alexandria", cities: cities(["Smouha", "Sidi Gaber", "Miami", "Montaza", "Agami", "Sporting", "Stanly", "Raml Station"]) },
  { name: "Dakahlia", cities: cities(["Mansoura", "Talkha", "Mit Ghamr", "Aga", "Belqas", "Dekernes", "Sherbin", "El Senbellawein"]) },
  { name: "Red Sea", cities: cities(["Hurghada", "Safaga", "Marsa Alam", "El Quseir", "Ras Gharib", "Shalateen"]) },
  { name: "Beheira", cities: cities(["Damanhur", "Kafr El Dawwar", "Rashid", "Abu Hummus", "Edko", "Kom Hamada", "Wadi El Natrun"]) },
  { name: "Faiyum", cities: cities(["Faiyum", "Sinnuris", "Ibshaway", "Tamiya", "Yusuf El Seddik", "New Faiyum"]) },
  { name: "Gharbia", cities: cities(["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "Samanoud", "Basyoun", "Qutour"]) },
  { name: "Ismailia", cities: cities(["Ismailia", "Fayed", "Qantara East", "Qantara West", "Abu Suwir", "Tell El Kebir"]) },
  { name: "Monufia", cities: cities(["Shibin El Kom", "Menouf", "Ashmoun", "El Bagour", "Sadat City", "Quesna", "Berket El Sab"]) },
  { name: "Minya", cities: cities(["Minya", "Mallawi", "Samalut", "Maghagha", "Beni Mazar", "Abu Qurqas", "Deir Mawas"]) },
  { name: "Qalyubia", cities: cities(["Banha", "Shubra El Kheima", "Qalyub", "El Khanka", "Kafr Shukr", "Toukh", "Obour City"]) },
  { name: "New Valley", cities: cities(["Kharga", "Dakhla", "Farafra", "Paris", "Balat", "Mut"]) },
  { name: "Suez", cities: cities(["Suez", "El Arbaeen", "Ataqah", "Faisal", "Ganayen"]) },
  { name: "Aswan", cities: cities(["Aswan", "Kom Ombo", "Edfu", "Daraw", "Abu Simbel", "Nasr El Nuba"]) },
  { name: "Assiut", cities: cities(["Assiut", "Abu Tig", "Manfalut", "Dayrout", "El Quseyya", "Badari", "Sahel Selim"]) },
  { name: "Beni Suef", cities: cities(["Beni Suef", "El Fashn", "Biba", "Somosta", "El Wasta", "Nasser", "Ihnasia"]) },
  { name: "Port Said", cities: cities(["Port Said", "Port Fouad", "El Arab", "El Manakh", "El Dawahy", "El Zohour"]) },
  { name: "Damietta", cities: cities(["Damietta", "New Damietta", "Ras El Bar", "Kafr Saad", "Faraskour", "El Zarqa", "Kafr El Battikh"]) },
  { name: "Sharqia", cities: cities(["Zagazig", "10th of Ramadan", "Belbeis", "Minya El Qamh", "Abu Hammad", "Faqous", "Hihya"]) },
  { name: "South Sinai", cities: cities(["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "Tor Sinai", "Saint Catherine", "Ras Sedr"]) },
  { name: "Kafr El Sheikh", cities: cities(["Kafr El Sheikh", "Desouk", "Fuwwah", "Baltim", "Sidi Salem", "El Hamool", "Motobas"]) },
  { name: "Matrouh", cities: cities(["Marsa Matrouh", "El Alamein", "Dabaa", "Sidi Barrani", "Sallum", "Siwa", "Hammam"]) },
  { name: "Luxor", cities: cities(["Luxor", "Esna", "Armant", "El Tod", "El Qurna", "El Zeniya"]) },
  { name: "Qena", cities: cities(["Qena", "Nag Hammadi", "Qus", "Deshna", "Abu Tesht", "Farshut", "Naqada"]) },
  { name: "North Sinai", cities: cities(["Arish", "Bir El Abd", "Rafah", "Sheikh Zuweid", "Nakhl", "Hassana"]) },
  { name: "Sohag", cities: cities(["Sohag", "Akhmim", "Girga", "Tahta", "Tama", "El Balyana", "Maragha"]) },
];

const governorateNamesAr: Record<string, string> = {
  Cairo: "القاهرة", Giza: "الجيزة", Alexandria: "الإسكندرية", Dakahlia: "الدقهلية",
  "Red Sea": "البحر الأحمر", Beheira: "البحيرة", Faiyum: "الفيوم", Gharbia: "الغربية",
  Ismailia: "الإسماعيلية", Monufia: "المنوفية", Minya: "المنيا", Qalyubia: "القليوبية",
  "New Valley": "الوادي الجديد", Suez: "السويس", Aswan: "أسوان", Assiut: "أسيوط",
  "Beni Suef": "بني سويف", "Port Said": "بورسعيد", Damietta: "دمياط", Sharqia: "الشرقية",
  "South Sinai": "جنوب سيناء", "Kafr El Sheikh": "كفر الشيخ", Matrouh: "مطروح", Luxor: "الأقصر",
  Qena: "قنا", "North Sinai": "شمال سيناء", Sohag: "سوهاج",
};

egyptGovernorates.forEach((governorate) => {
  governorate.nameAr = governorateNamesAr[governorate.name] ?? governorate.name;
});
