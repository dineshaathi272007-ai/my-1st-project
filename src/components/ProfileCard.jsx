export default function ProfileCard({
  name,
  imageSrc,
  className = 'profile-image',
  width = 768,
  height = 768,
}) {
  return (
    <img
      src={imageSrc}
      alt={name}
      className={className}
      width={width}
      height={height}
    />
  );
}
