import { ArrowUpRight } from 'lucide-react';
import type { BookingLink } from '@/lib/booking';
import TelegramIcon from '../telegram-icon';
import { MailFilledIcon, PhoneFilledIcon } from '../contact-icons';

const channelIcon = { telegram: <TelegramIcon />, phone: <PhoneFilledIcon />, email: <MailFilledIcon />, page: null };

/** The one filled action on the page: it always leads to the conversation with Pavlo. */
export default function BookingAction({ link, label = 'Хочу тату', className = '', icon = true }: { link: BookingLink; label?: string; className?: string; icon?: boolean }) {
  return <a className={`wow-action wow-primary ${className}`} href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noreferrer' : undefined}>
    {icon && channelIcon[link.channel]}
    <span>{label}</span>
    <ArrowUpRight size={18} aria-hidden="true" />
  </a>;
}
