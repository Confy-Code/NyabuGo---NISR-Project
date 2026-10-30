import { getInitials } from '../context/AuthContext.jsx';

export default function Avatar({ user, size = 'h-9 w-9', text = 'text-xs' }) {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'User avatar'}
        className={`${size} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <span
      className={`${size} ${text} inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-bold text-white`}
    >
      {getInitials(user?.name)}
    </span>
  );
}
