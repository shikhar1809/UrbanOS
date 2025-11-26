'use client';

export default function CommunityWires() {
  return (
    <div className="relative w-full h-[200px] md:h-[250px]">
      {/* Simple Static Wire */}
      <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-700 -translate-x-1/2" 
           style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)' }}
      />
    </div>
  );
}

