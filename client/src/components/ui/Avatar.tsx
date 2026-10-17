const SIZE_CLASSES = { xs: "w-5 h-5 text-[10px]", sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-base", lg: "w-20 h-20 text-2xl" } as const;
const COLORS = ["bg-green-600","bg-blue-600","bg-purple-600","bg-pink-600","bg-orange-600","bg-teal-600","bg-indigo-600","bg-rose-600"];
function getColor(name: string): string { let hash=0; for(let i=0;i<name.length;i++) hash=name.charCodeAt(i)+((hash<<5)-hash); return COLORS[Math.abs(hash)%COLORS.length]; }
function getFlagEmoji(countryCode?: string): string { if(!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return ""; return String.fromCodePoint(...countryCode.split("").map(char=>127397+char.charCodeAt(0))); }
interface AvatarProps { src?: string; name: string; countryCode?: string; size?: "xs"|"sm"|"md"|"lg"; className?: string; }
export default function Avatar({src,name,countryCode,size="md",className=""}:AvatarProps) {
 const sizeClass=SIZE_CLASSES[size]; const initial=name.charAt(0).toUpperCase(); const flag=getFlagEmoji(countryCode?.toUpperCase()); const avatarClass=`${sizeClass} rounded-full object-cover shrink-0 ${className}`;
 const avatar=src ? <img src={src} alt={name} className={avatarClass}/> : <div className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center text-on-accent font-bold shrink-0 ${className}`} aria-label={name}>{initial}</div>;
 return <span className="inline-flex items-center gap-1.5 shrink-0">{avatar}{flag && <span className={`leading-none ${size==="xs"?"text-[10px]":size==="sm"?"text-xs":size==="lg"?"text-xl":"text-sm"}`} role="img" aria-label={`País: ${countryCode}`} title={countryCode}>{flag}</span>}</span>;
}
