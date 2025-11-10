interface RankBadgeProps {
  rank: number;
}

const RankBadge = ({ rank }: RankBadgeProps) => {
  // 前三名使用盾牌徽章
  if (rank === 1) {
    return (
      <div className="relative w-7 h-9 flex items-center justify-center">
        <svg width="28" height="36" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 0H18V15.2348C18 16.3243 17.4093 17.3282 16.4569 17.8573L9.97129 21.4604C9.36724 21.796 8.63276 21.796 8.02871 21.4604L1.54307 17.8573C0.590677 17.3282 0 16.3243 0 15.2348V0Z"
            fill="#FFD700"
          />
          <text
            x="50%"
            y="24%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#B8860B"
            fontSize="5"
            fontWeight="bold"
          >
            TOP
          </text>
          <text
            x="50%"
            y="58%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#B8860B"
            fontSize="10"
            fontWeight="bold"
          >
            1
          </text>
        </svg>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="relative w-7 h-9 flex items-center justify-center">
        <svg width="28" height="36" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 0H18V15.2348C18 16.3243 17.4093 17.3282 16.4569 17.8573L9.97129 21.4604C9.36724 21.796 8.63276 21.796 8.02871 21.4604L1.54307 17.8573C0.590677 17.3282 0 16.3243 0 15.2348V0Z"
            fill="#C0C0C0"
          />
          <text
            x="50%"
            y="24%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#808080"
            fontSize="5"
            fontWeight="bold"
          >
            TOP
          </text>
          <text
            x="50%"
            y="58%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#808080"
            fontSize="10"
            fontWeight="bold"
          >
            2
          </text>
        </svg>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="relative w-7 h-9 flex items-center justify-center">
        <svg width="28" height="36" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 0H18V15.2348C18 16.3243 17.4093 17.3282 16.4569 17.8573L9.97129 21.4604C9.36724 21.796 8.63276 21.796 8.02871 21.4604L1.54307 17.8573C0.590677 17.3282 0 16.3243 0 15.2348V0Z"
            fill="#CD7F32"
          />
          <text
            x="50%"
            y="24%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#8B4513"
            fontSize="5"
            fontWeight="bold"
          >
            TOP
          </text>
          <text
            x="50%"
            y="58%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#8B4513"
            fontSize="10"
            fontWeight="bold"
          >
            3
          </text>
        </svg>
      </div>
    );
  }

  // 其他排名使用灰色盾牌
  return (
    <div className="relative w-7 h-9 flex items-center justify-center">
      <svg width="28" height="36" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0 0H18V15.2348C18 16.3243 17.4093 17.3282 16.4569 17.8573L9.97129 21.4604C9.36724 21.796 8.63276 21.796 8.02871 21.4604L1.54307 17.8573C0.590677 17.3282 0 16.3243 0 15.2348V0Z"
          fill="#60646C"
        />
        <text
          x="50%"
          y="48%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize={rank >= 100 ? "8" : "11"}
          fontWeight="bold"
        >
          {rank}
        </text>
      </svg>
    </div>
  );
};

export default RankBadge;

