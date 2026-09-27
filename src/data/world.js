/* world tickets, city data, line icons, city tasks, city stamps */

/* ---------- data ---------- */
const COUNTRY={
  cn:{name:"中国",en:"China",flag:"🇨🇳"}, th:{name:"泰国",en:"Thailand",flag:"🇹🇭"},
  sg:{name:"新加坡",en:"Singapore",flag:"🇸🇬"}, my:{name:"马来西亚",en:"Malaysia",flag:"🇲🇾"},
  jp:{name:"日本",en:"Japan",flag:"🇯🇵"}, kr:{name:"韩国",en:"Korea",flag:"🇰🇷"},
  vn:{name:"越南",en:"Vietnam",flag:"🇻🇳"}, id:{name:"印度尼西亚",en:"Indonesia",flag:"🇮🇩"},
  fr:{name:"法国",en:"France",flag:"🇫🇷"}, it:{name:"意大利",en:"Italy",flag:"🇮🇹"}
};
const CITY={
  bj:{k:"cn",name:"北京",en:"Beijing",color:"#9e2f2a"}, sh:{k:"cn",name:"上海",en:"Shanghai",color:"#3b4f7a"},
  hz:{k:"cn",name:"杭州",en:"Hangzhou",color:"#4f8a7a"}, xa:{k:"cn",name:"西安",en:"Xi'an",color:"#8a6a3a"},
  cd:{k:"cn",name:"成都",en:"Chengdu",color:"#5a8a3f"},
  fz:{k:"cn",name:"福州",en:"Fuzhou",color:"#4d7a44"}, xm:{k:"cn",name:"厦门",en:"Xiamen",color:"#2f6c9f"},
  qz:{k:"cn",name:"泉州",en:"Quanzhou",color:"#a8352e"}, zz:{k:"cn",name:"漳州",en:"Zhangzhou",color:"#b9822a"},
  ly:{k:"cn",name:"龙岩",en:"Longyan",color:"#8f5a33"}, np:{k:"cn",name:"南平",en:"Nanping",color:"#2f7a6a"},
  sm:{k:"cn",name:"三明",en:"Sanming",color:"#b55a33"}, nd:{k:"cn",name:"宁德",en:"Ningde",color:"#52698a"},
  pt:{k:"cn",name:"莆田",en:"Putian",color:"#8a466b"}, pn:{k:"cn",name:"平潭",en:"Pingtan",color:"#237f98"},
  bkk:{k:"th",name:"曼谷",en:"Bangkok",color:"#b98424"}, cm:{k:"th",name:"清迈",en:"Chiang Mai",color:"#7a5a8a"},
  pk:{k:"th",name:"普吉岛",en:"Phuket",color:"#1f8a9a"}, ay:{k:"th",name:"大城",en:"Ayutthaya",color:"#9a6a4a"},
  sgc:{k:"sg",name:"新加坡",en:"Singapore",color:"#c2404a"},
  kl:{k:"my",name:"吉隆坡",en:"Kuala Lumpur",color:"#3a5f8f"}, pg:{k:"my",name:"槟城",en:"Penang",color:"#3f8a6a"},
  ml:{k:"my",name:"马六甲",en:"Melaka",color:"#b0473a"}, sb:{k:"my",name:"沙巴",en:"Sabah",color:"#4f7a4a"},
  tk:{k:"jp",name:"东京",en:"Tokyo",color:"#c05a3a"}, ky:{k:"jp",name:"京都",en:"Kyoto",color:"#a83a3a"},
  os:{k:"jp",name:"大阪",en:"Osaka",color:"#5a6a8a"}, fj:{k:"jp",name:"富士山",en:"Mt. Fuji",color:"#4a6f9a"},
  se:{k:"kr",name:"首尔",en:"Seoul",color:"#6a4a8a"}, jj:{k:"kr",name:"济州岛",en:"Jeju",color:"#3a7a8a"},
  hn:{k:"vn",name:"河内",en:"Hanoi",color:"#4a7a5a"}, hl:{k:"vn",name:"下龙湾",en:"Ha Long",color:"#2f7a8a"},
  ha:{k:"vn",name:"会安",en:"Hoi An",color:"#c0822a"},
  bl:{k:"id",name:"巴厘岛",en:"Bali",color:"#3f8a5f"}, yg:{k:"id",name:"日惹",en:"Yogyakarta",color:"#7a6a4a"},
  pa:{k:"fr",name:"巴黎",en:"Paris",color:"#3f5a8a"},
  rm:{k:"it",name:"罗马",en:"Rome",color:"#a0603a"}, vc:{k:"it",name:"威尼斯",en:"Venice",color:"#2f6f8a"}
};
const S=(id,c,name,en,tag,icon,lat,lng,mean,fact)=>({id,c,name,en,tag,icon,lat,lng,mean,fact});
const SPOTS=[
 S("bj1","bj","故宫","The Forbidden City","世界遗产","palace",39.916,116.397,"愿你走过的每一道门，都通往更好的地方。","1420年建成，是世界上现存规模最大、保存最完整的木结构宫殿建筑群之一。"),
 S("bj2","bj","八达岭长城","Badaling Great Wall","世界遗产","greatwall",40.359,116.02,"不到长城非好汉，今天的你就是好汉。","长城1987年列入世界文化遗产，八达岭是保存最好、最有代表性的一段。"),
 S("bj3","bj","天坛","Temple of Heaven","世界遗产","temple",39.882,116.407,"天圆地方，愿你心里也有自己的方向。","明清两代皇帝祭天祈谷的地方，圆形的祈年殿是北京的标志之一。"),
 S("sh1","sh","外滩","The Bund","滨江","skyline",31.24,121.49,"一边是百年老楼，一边是未来，愿你既念旧也向前。","黄浦江西岸的一排历史建筑被称为“万国建筑博览群”，对岸就是陆家嘴的摩天楼。"),
 S("sh2","sh","豫园","Yu Garden","园林","lake",31.227,121.492,"园子不大却曲径通幽，好事也藏在转角里。","始建于明代的江南古典园林，旁边的城隍庙老街小吃很多。"),
 S("hz1","hz","西湖","West Lake","世界遗产","lake",30.25,120.15,"欲把西湖比西子，今天的风景刚刚好。","2011年列入世界文化遗产，苏堤、白堤和断桥都是经典打卡点。"),
 S("hz2","hz","灵隐寺","Lingyin Temple","古刹","temple",30.24,120.1,"山林深处的钟声，替你把心事放下。","始建于东晋的千年古刹，寺前飞来峰上有大量石刻造像。"),
 S("xa1","xa","兵马俑","Terracotta Army","世界遗产","warrior",34.385,109.279,"千军万马都站在你身后，放心往前冲。","1974年被发现，是秦始皇陵的陪葬坑，每一个陶俑的面孔都不一样。"),
 S("xa2","xa","西安城墙","Xi'an City Wall","古迹","citywall",34.26,108.94,"城墙守护着城，也愿好运一直守护着你。","现存城墙主要建于明代，是中国保存最完整的古城墙之一，可以在城墙上骑车绕一圈。"),
 S("cd1","cd","大熊猫基地","Giant Panda Base","萌宠","panda",30.735,104.146,"慢吞吞也没关系，做个快乐的滚滚就好。","成都北郊的大熊猫繁育研究基地，早上去最容易看到熊猫活动。"),
 S("cd2","cd","宽窄巷子","Kuanzhai Alley","古街","alley",30.664,104.055,"宽也好窄也好，巴适就好。","由宽巷子、窄巷子和井巷子组成的老街区，茶馆和川味小吃很多。"),
 S("fz1","fz","三坊七巷","Three Lanes & Seven Alleys","古街","gate",26.083,119.292,"走过坊巷的石板路，愿你的日子有来处，也有归处。","福州保存较完整的明清古街区，白墙黛瓦和马鞍墙连成一片，被称为“中国城市里坊制度的活化石”。"),
 S("fz2","fz","鼓山","Gushan Mountain","名山","mountain",26.058,119.395,"一步一台阶，好运也会一级一级往上走。","福州东郊的名山，山上有千年古刹涌泉寺，登山古道两旁留有大量历代摩崖题刻。"),
 S("fz3","fz","福州西湖","West Lake of Fuzhou","园林","lake",26.093,119.293,"湖水静静的，心也跟着慢下来。","始凿于晋代，已有一千七百多年历史，是福州保存最完整的古典园林。"),
 S("xm1","xm","鼓浪屿","Gulangyu Island","世界遗产","piano",24.447,118.067,"琴声和海浪同频，愿你的生活一直有好听的节奏。","2017年列入世界文化遗产。岛上钢琴密度很高，被称为“钢琴之岛”，岛上不通汽车，适合慢慢走。"),
 S("xm2","xm","南普陀寺","Nanputuo Temple","古刹","temple",24.442,118.097,"背靠青山，面朝大海，心有所安。","闽南千年古刹，背靠五老峰、面朝厦门港。"),
 S("xm3","xm","厦门大学","Xiamen University","校园","campus",24.437,118.099,"愿你永远保有好奇心，一直在学，一直在长。","1921年由爱国华侨陈嘉庚创办，红瓦白墙的“嘉庚建筑”依海而建，常被称为最美大学之一。"),
 S("xm4","xm","环岛路","Huandao Road","滨海","road",24.43,118.13,"风从海上来，把烦恼都吹远一点。","沿着厦门岛东南海岸修建的滨海大道，一边是海一边是城，很适合骑车吹风。"),
 S("xm5","xm","曾厝垵","Zengcuo'an Village","美食","alley",24.428,118.121,"巷子里的烟火气，是旅途里最暖的一口。","由海边渔村变成的文创村，窄巷里挤满了小吃店、手作店和民宿。"),
 S("qz1","qz","开元寺东西塔","Twin Pagodas of Kaiyuan","世界遗产","pagoda",24.915,118.582,"像双塔一样，站得稳，也看得远。","开元寺始建于唐代，东西两座石塔历经大地震依然屹立，是泉州世界遗产的一部分。"),
 S("qz2","qz","洛阳桥","Luoyang Bridge","古桥","bridge",24.955,118.677,"桥连两岸，愿你想见的人都能见到。","北宋时由蔡襄主持修建的跨海石桥，与赵州桥等并称中国古代四大名桥。"),
 S("qz3","qz","清源山老君岩","Laojun Rock","名山","statue",24.955,118.6,"愿你也有这份从容，笑看风起云涌。","清源山上的宋代道教石雕，依一整块天然巨石雕成老子坐像，神态安详。"),
 S("qz4","qz","蟳埔簪花","Xunpu Flower Crown","非遗","flower",24.87,118.66,"把花戴在头上，也把好心情戴在身上。","蟳埔女习惯把鲜花一圈圈簪在发髻上，当地有“今世戴花，来世漂亮”的说法。"),
 S("zz1","zz","田螺坑土楼群","Tianluokeng Tulou","世界遗产","tulou",24.586,117.058,"一家人围在一起，就是最圆满的样子。","一座方楼居中，圆楼与椭圆楼环绕四周，俯瞰像“四菜一汤”。2008年随福建土楼列入世界遗产。"),
 S("zz2","zz","云水谣古镇","Yunshuiyao Old Town","古镇","banyan",24.65,117.05,"日子慢一点，也很好。","溪水、老榕树、古道和土楼组成的安静小镇，适合走走停停。"),
 S("zz3","zz","东山风动石","Wind-moving Rock","海岛","rock",23.73,117.53,"风来石动而不倒，愿你稳稳地面对每一次变化。","东山岛上的一块巨石，底部接触面很小，风大时看起来像在摇晃，却一直没有倒。"),
 S("zz4","zz","漳州古城","Zhangzhou Old Town","古街","arch",24.51,117.65,"老街老巷老味道，好日子也是慢慢熬出来的。","保留着明清时期的街巷格局、石牌坊和骑楼，老字号小吃藏在街边。"),
 S("ly1","ly","永定承启楼","Chengqi Tulou","世界遗产","tulou",24.66,116.97,"一圈又一圈，把温暖和守护都围在里面。","永定高头乡的圆形土楼，几圈楼房环环相套，被称为“土楼之王”。"),
 S("ly2","ly","古田会议旧址","Gutian Meeting Site","红色","hall",25.19,116.83,"不忘出发时的样子，走得再远也记得来路。","1929年12月，古田会议在这里召开，是重要的红色教育基地。"),
 S("ly3","ly","冠豸山","Guanzhai Mountain","丹霞","danxia",25.68,116.77,"山形端正，愿你也坦坦荡荡、堂堂正正。","连城县的丹霞名山，主峰形似古代獬豸冠而得名。"),
 S("np1","np","武夷山九曲溪","Nine-bend Stream","世界遗产","raft",27.63,117.96,"顺流而下，也会遇见最好的风景。","1999年武夷山列入世界文化与自然双遗产。坐竹筏顺九曲溪漂流，两岸是丹山碧水。"),
 S("np2","np","大红袍母树","Da Hong Pao Mother Trees","茶","tea",27.66,117.97,"好茶要慢慢泡，好事也值得慢慢等。","武夷岩茶中的名丛，母树长在九龙窠的岩壁上。"),
 S("np3","np","天游峰","Tianyou Peak","名山","peak",27.64,117.95,"爬上去的那一刻，风景会给你最好的奖励。","武夷山的代表性山峰，登顶可以俯瞰九曲溪蜿蜒穿过群山。"),
 S("sm1","sm","泰宁大金湖","Taining Golden Lake","世界遗产","danxia",26.87,117.17,"红岩映碧水，愿你的日子也有鲜亮的颜色。","作为“中国丹霞”的一部分于2010年列入世界自然遗产，湖水映着赤红的崖壁。"),
 S("sm2","sm","沙县小吃","Shaxian Snacks","美食","bowl",26.4,117.79,"走到哪里，都能吃上一口熟悉的味道。","来自三明沙县的小吃，扁肉、拌面和蒸饺是招牌，门店开遍全国。"),
 S("nd1","nd","太姥山","Mount Taimu","名山","peak",27.1,120.2,"山海之间，把心放大一点。","素有“海上仙都”之称，花岗岩峰林奇石林立，山顶能望见大海。"),
 S("nd2","nd","霞浦滩涂","Xiapu Mudflats","摄影","tide",26.88,120.0,"潮起潮落都是风景，等一等，光就来了。","潮水退去后，竹竿、渔网和光影在滩涂上交织，是有名的摄影胜地。"),
 S("nd3","nd","屏南白水洋","Baishuiyang","奇观","wave",26.98,118.98,"踩着水往前走，愿你一路都轻快。","河床是一整块平坦的岩石，水浅而清，可以直接在水面上行走。"),
 S("pt1","pt","湄洲岛","Meizhou Island","非遗","mazu",25.07,119.12,"愿你出行平安，一路都有人守护。","妈祖信俗的发源地，岛上有妈祖祖庙。2009年“妈祖信俗”列入联合国人类非物质文化遗产。"),
 S("pn1","pn","平潭蓝眼泪","Blue Tears of Pingtan","海岛","glow",25.5,119.79,"愿你遇见的每一次闪光，都刚好被你看见。","春夏之交的夜晚，海浪里的夜光藻会发出蓝色荧光，被叫作“蓝眼泪”。"),
 S("pn2","pn","北港石头厝","Beigang Stone Houses","古村","stone",25.61,119.82,"石头房子挡得住海风，愿你也有自己的避风港。","平潭海边的老村，房子用花岗岩垒成，能抵挡大风，如今成了文创村。"),

 S("bkk1","bkk","大皇宫","The Grand Palace","皇家","prang",13.75,100.491,"金光闪闪的一天，愿你也被好运照亮。","1782年开始修建，曾是泰国王室的居所，宫内的玉佛寺供奉着泰国最尊贵的玉佛。"),
 S("bkk2","bkk","郑王庙","Wat Arun","寺庙","prang",13.744,100.489,"黎明寺迎着第一缕光，愿你每天醒来都有希望。","位于湄南河西岸，又叫黎明寺，佛塔上镶满彩色瓷片，傍晚看最美。"),
 S("bkk3","bkk","卧佛寺","Wat Pho","寺庙","recline",13.746,100.493,"累了就躺一躺，休息也是前进的一部分。","寺内有一尊约46米长的金色卧佛，这里也是传统泰式按摩的重要传承地。"),
 S("cm1","cm","素贴山双龙寺","Wat Phra That Doi Suthep","寺庙","prang",18.805,98.922,"爬完三百多级台阶，心愿就离你更近一点。","清迈的圣地，要走上两侧有神蛇扶栏的长阶梯，山顶能俯瞰整个清迈城。"),
 S("cm2","cm","塔佩门","Tha Phae Gate","古城","citywall",18.787,98.993,"从这道门走进古城，慢生活就开始了。","清迈古城东边的城门，红砖城墙边常有市集，周日还有热闹的步行街。"),
 S("pk1","pk","神仙半岛","Promthep Cape","海景","cape",7.762,98.305,"看一场日落，把今天温柔地收好。","普吉岛最南端的岬角，是岛上最有名的看日落地点。"),
 S("ay1","ay","大城玛哈泰寺","Wat Mahathat","世界遗产","stupa",14.357,100.567,"时间会长出温柔，就像树根里的佛头。","大城历史公园1991年列入世界遗产，玛哈泰寺里有一尊被树根缠绕的佛头。"),

 S("sg1","sgc","鱼尾狮","Merlion Park","地标","merlion",1.287,103.854,"狮子的勇气加上鱼的自在，就是你今天的状态。","新加坡的标志，狮头鱼身，面朝滨海湾喷水，对面就是滨海湾金沙。"),
 S("sg2","sgc","滨海湾花园","Gardens by the Bay","花园","tree",1.282,103.864,"像超级树一样，向上长，也发着光。","巨大的“超级树”林立，每晚都有灯光音乐秀，还有云雾林和花穹两座温室。"),
 S("sg3","sgc","新加坡植物园","Singapore Botanic Gardens","世界遗产","banyan",1.314,103.816,"在绿意里深呼吸，好运跟着新鲜空气一起来。","2015年列入世界文化遗产，是新加坡的第一处世界遗产，园内的国家胡姬花园很有名。"),
 S("sg4","sgc","牛车水","Chinatown","街区","alley",1.283,103.844,"在异乡遇见熟悉的烟火气，走到哪里都有家的味道。","新加坡的唐人街，老店屋、庙宇和小贩中心挤在一起，美食很多。"),
 S("sg5","sgc","圣淘沙","Sentosa","海岛","cape",1.25,103.83,"阳光、沙滩和一点点冒险，今天值得开心。","新加坡南边的度假岛，有沙滩、主题乐园和海洋馆。"),

 S("kl1","kl","双子塔","Petronas Twin Towers","地标","twin",3.158,101.712,"两座塔互相守望，愿你身边一直有并肩的人。","吉隆坡的地标，两座88层的塔楼由空中天桥相连，曾是世界最高的建筑。"),
 S("kl2","kl","黑风洞","Batu Caves","圣地","stairs",3.237,101.684,"一级一级往上爬，彩虹就在脚下。","石灰岩山洞里的印度教圣地，要爬272级彩色台阶，洞口立着巨大的金色神像。"),
 S("pg1","pg","乔治市","George Town","世界遗产","bike",5.414,100.33,"在街角遇见一幅画，也遇见今天的好心情。","2008年与马六甲一起列入世界文化遗产，老街上的街头壁画是打卡热门。"),
 S("ml1","ml","马六甲红屋","Stadthuys","世界遗产","arch",2.194,102.249,"红色的老房子记着很多故事，愿你的故事也精彩。","荷兰殖民时期留下的红色建筑群，旁边的鸡场街每逢周末有热闹夜市。"),
 S("sb1","sb","京那巴鲁山","Mount Kinabalu","世界遗产","peak",6.075,116.558,"站上高处看云海，你比想象中更了不起。","东南亚最高峰之一，海拔约4095米，所在的京那巴鲁公园2000年列入世界自然遗产。"),

 S("tk1","tk","浅草寺","Senso-ji","寺庙","temple",35.715,139.797,"穿过雷门，把新的好运一起带回家。","东京最古老的寺庙，雷门下挂着巨大的红灯笼，门前的仲见世商店街很热闹。"),
 S("tk2","tk","东京塔","Tokyo Tower","地标","tower",35.659,139.745,"高高亮起的橘色灯光，是城市在对你说晚安。","1958年建成，高333米，夜晚亮起温暖的橙色灯光。"),
 S("ky1","ky","伏见稻荷大社","Fushimi Inari Taisha","神社","torii",34.967,135.773,"穿过千本鸟居，每一道门都是一个祝福。","以连绵不绝的红色“千本鸟居”闻名，沿着山路一直延伸到稻荷山。"),
 S("ky2","ky","清水寺","Kiyomizu-dera","世界遗产","temple",34.995,135.785,"站在清水舞台上，勇敢做一次决定吧。","悬空的木造“清水舞台”很有名，属于“古都京都文化财”世界遗产，春樱秋枫都很美。"),
 S("os1","os","大阪城","Osaka Castle","古城","castle",34.687,135.526,"城墙很高，你的心也可以很强大。","由丰臣秀吉主持修建，天守阁四周是护城河和公园，春天是赏樱胜地。"),
 S("fj1","fj","富士山","Mount Fuji","世界遗产","volcano",35.36,138.727,"看见富士山的那一刻，愿你的心愿都能成真。","海拔3776米，是日本最高峰，2013年作为文化遗产列入世界遗产名录。"),

 S("se1","se","景福宫","Gyeongbokgung Palace","宫殿","palace",37.58,126.977,"穿上韩服走一走，做一天自己的主角。","1395年建成，是朝鲜王朝的正宫，穿韩服可以免费入场。"),
 S("se2","se","北村韩屋村","Bukchon Hanok Village","古村","temple",37.582,126.983,"老房子里的安静，让你听见自己的心声。","景福宫和昌德宫之间的传统韩屋聚落，至今仍有居民生活，参观要保持安静。"),
 S("se3","se","N首尔塔","N Seoul Tower","地标","seoultower",37.551,126.988,"挂上一把锁，把重要的人和心意都锁住。","位于南山山顶，可以俯瞰首尔，塔下的栏杆挂满了爱情锁。"),
 S("jj1","jj","城山日出峰","Seongsan Ilchulbong","世界遗产","volcano",33.458,126.942,"早起看一次日出，新的一天从你开始。","济州岛东边的火山口，2007年随济州火山岛和熔岩洞列入世界自然遗产，是看日出的好地方。"),

 S("hn1","hn","还剑湖","Hoan Kiem Lake","湖泊","lake",21.029,105.852,"把宝剑还给神龟，愿你手里的都刚刚好。","河内老城中心的湖，传说黎利王在这里把宝剑还给了神龟，湖中有龟塔。"),
 S("hl1","hl","下龙湾","Ha Long Bay","世界遗产","karst",20.91,107.18,"千岛如龙，愿你的好运也连绵不绝。","1994年列入世界自然遗产，海面上散布着上千座石灰岩岛屿，适合坐船游览。"),
 S("ha1","ha","会安古镇","Hoi An Ancient Town","世界遗产","alley",15.877,108.326,"一盏灯笼一个愿望，愿你的夜晚温暖明亮。","1999年列入世界文化遗产，入夜后满街彩色灯笼亮起，还有古老的日本廊桥。"),

 S("bl1","bl","海神庙","Tanah Lot","神庙","cape",-8.621,115.087,"潮水来来去去，愿你始终站得稳稳的。","建在海边岩石上的神庙，涨潮时像漂在海上，是巴厘岛看日落的经典地点。"),
 S("bl2","bl","德格拉朗梯田","Tegallalang Rice Terrace","梯田","terrace",-8.434,115.279,"一层一层的绿，是时间慢慢写下的诗。","乌布北边的层层稻田，沿用传统的苏巴克灌溉系统，清晨光线最好。"),
 S("yg1","yg","婆罗浮屠","Borobudur","世界遗产","stupa",-7.608,110.204,"一层层往上走，心会越来越轻。","建于9世纪左右，是世界上最大的佛教建筑群之一，1991年列入世界文化遗产。"),

 S("pa1","pa","埃菲尔铁塔","Eiffel Tower","地标","tower",48.858,2.294,"在铁塔下许个愿，浪漫会一直跟着你。","为1889年巴黎世界博览会建成，是巴黎最有名的地标，夜里整点会闪灯。"),
 S("pa2","pa","卢浮宫","The Louvre","博物馆","pyramid",48.861,2.336,"美好的东西值得慢慢看，你也值得被慢慢欣赏。","世界上最大的艺术博物馆之一，入口的玻璃金字塔由贝聿铭设计，1989年落成。"),
 S("rm1","rm","斗兽场","Colosseum","世界遗产","arena",41.89,12.492,"经历过风雨的地方最有力量，你也一样。","公元80年左右建成的古罗马圆形竞技场，是罗马最有名的古迹。"),
 S("rm2","rm","许愿池","Trevi Fountain","喷泉","fountain",41.901,12.483,"背对泉水抛一枚硬币，愿你还会再回来。","罗马最大的巴洛克式喷泉，传说背对着泉水抛硬币，就会再回到罗马。"),
 S("vc1","vc","威尼斯水城","Venice","世界遗产","gondola",45.434,12.338,"坐上贡多拉，让水路带你去想去的地方。","建在潟湖小岛上的水城，1987年列入世界文化遗产，贡多拉是它的招牌。")
];
const ICON={
  gate:`<path d="M6 72H114"/><path d="M14 72V40Q24 26 34 40Q44 22 54 40V72"/><path d="M54 46H94V72"/><path d="M94 46Q103 32 112 46V72"/><path d="M66 72V56H82V72"/><path d="M24 52h10v8H24z"/>`,
  mountain:`<path d="M4 72L36 30L52 50L72 16L116 72Z"/><path d="M62 30h18M65 30l6-6 6 6"/><path d="M20 72q10-6 20 0"/>`,
  lake:`<path d="M38 42L60 26L82 42Z"/><path d="M44 42V58M76 42V58M38 58H82"/><path d="M6 68q10-6 20 0t20 0t20 0t20 0t20 0t20 0"/><path d="M20 76q10-4 20 0t20 0"/>`,
  piano:`<path d="M4 66Q40 40 82 56Q100 62 116 66"/><path d="M40 52V40L52 32L64 40V54"/><path d="M86 18v18M86 18l12-4v16"/><circle cx="82" cy="36" r="4"/><circle cx="94" cy="32" r="4"/><path d="M8 76q10-4 20 0t20 0t20 0t20 0t20 0"/>`,
  temple:`<path d="M16 40Q60 20 104 40"/><path d="M30 34Q60 14 90 34"/><path d="M26 40V68M94 40V68M20 68H100"/><path d="M50 68V52H70V68"/><path d="M60 14V8"/>`,
  campus:`<path d="M12 40L60 22L108 40Z"/><path d="M18 40V70H102V40"/><path d="M30 70V56a6 6 0 0 1 12 0V70M54 70V56a6 6 0 0 1 12 0V70M78 70V56a6 6 0 0 1 12 0V70"/><path d="M60 22V12"/>`,
  road:`<path d="M4 72C40 64 64 42 116 34"/><path d="M16 76C50 68 74 50 116 44"/><path d="M26 56V26"/><path d="M26 26q-12-2-16 6M26 26q12-4 18 2M26 26q-4-10 4-14"/><path d="M70 72q10-4 20 0t20 0"/>`,
  alley:`<path d="M14 72V20M106 72V20"/><path d="M14 26Q60 44 106 26"/><circle cx="36" cy="40" r="5"/><circle cx="60" cy="45" r="5"/><circle cx="84" cy="40" r="5"/><path d="M36 45v4M60 50v4M84 45v4"/><path d="M40 72L52 58H68L80 72"/>`,
  pagoda:`<path d="M26 72V18"/><path d="M16 30H36M18 42H34M20 54H32M18 66H34"/><path d="M26 18l-4-6h8z"/><path d="M92 72V18"/><path d="M82 30H102M84 42H100M86 54H98M84 66H100"/><path d="M92 18l-4-6h8z"/><path d="M40 72H80"/>`,
  bridge:`<path d="M4 44H116M4 50H116"/><path d="M16 50V64M40 50V64M64 50V64M88 50V64M108 50V64"/><path d="M12 64h8M36 64h8M60 64h8M84 64h8M104 64h8"/><path d="M4 72q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/><path d="M60 44V30l6 4"/>`,
  statue:`<circle cx="60" cy="26" r="11"/><path d="M40 70Q38 42 60 38Q82 42 80 70Z"/><path d="M54 32q6 14 12 0"/><path d="M20 72H100"/>`,
  flower:`<path d="M30 60Q60 76 90 60"/><circle cx="60" cy="44" r="16"/><circle cx="38" cy="40" r="7"/><circle cx="82" cy="40" r="7"/><circle cx="48" cy="26" r="6"/><circle cx="72" cy="26" r="6"/><circle cx="60" cy="22" r="6"/><circle cx="30" cy="54" r="5"/><circle cx="90" cy="54" r="5"/>`,
  tulou:`<ellipse cx="60" cy="36" rx="44" ry="12"/><path d="M16 36V58M104 36V58"/><path d="M16 58Q60 78 104 58"/><ellipse cx="60" cy="36" rx="22" ry="5"/><path d="M34 46V64M60 48V68M86 46V64"/><path d="M54 68V60H66V68"/>`,
  banyan:`<path d="M60 72V40"/><path d="M60 46L46 72M60 50L74 72"/><path d="M24 40Q20 18 44 16Q54 4 72 12Q98 10 96 32Q100 46 80 44Q64 50 48 44Q28 50 24 40Z"/><path d="M40 44v14M84 44v12"/><path d="M6 72H114"/>`,
  rock:`<path d="M38 58Q40 26 70 24Q94 26 90 48Q82 60 64 58Z"/><path d="M58 58l6 4 6-4"/><path d="M14 72Q60 56 106 72"/><path d="M10 78q10-4 20 0t20 0t20 0t20 0t20 0"/>`,
  arch:`<path d="M16 72V30H104V72"/><path d="M12 30H108M20 22H100"/><path d="M36 72V42H84V72"/><path d="M48 30V42M72 30V42"/><path d="M8 72H112"/>`,
  hall:`<path d="M16 42L60 24L104 42"/><path d="M22 42V70H98V42"/><path d="M52 70V52H68V70"/><path d="M30 50h12v8H30zM78 50h12v8H78z"/><path d="M60 24V8l12 4-12 4"/>`,
  danxia:`<path d="M4 70V44Q10 34 24 36H40Q46 26 60 30V70"/><path d="M60 40Q74 34 86 40H104Q112 44 116 50V70"/><path d="M6 76q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/><path d="M20 48h10M72 50h12"/>`,
  raft:`<path d="M4 20L26 46L44 26L64 48L84 18L116 50"/><path d="M28 62H92"/><path d="M26 66H94"/><path d="M40 62V52M40 52l-4-2"/><path d="M84 62L96 44"/><path d="M6 74q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/>`,
  tea:`<path d="M30 48H90Q88 70 60 70Q32 70 30 48Z"/><path d="M26 48H94"/><path d="M40 72H80"/><path d="M50 40q-4-8 2-14M62 40q-4-8 2-14"/><path d="M84 30Q96 14 110 18Q104 34 84 30Z"/><path d="M86 30q10-6 20-10"/>`,
  peak:`<path d="M4 72L30 36L42 48L60 14L78 42L90 30L116 72Z"/><path d="M52 28l8 8 8-8"/><path d="M14 20q8-4 14 0M92 16q8-4 14 0"/>`,
  bowl:`<path d="M16 46H104Q100 72 60 72Q20 72 16 46Z"/><path d="M26 54q8 4 16 0t16 0t16 0t16 0"/><path d="M68 40L100 12M76 42L106 18"/><path d="M40 36q-4-8 2-14M54 34q-4-8 2-14"/>`,
  tide:`<circle cx="92" cy="22" r="9"/><path d="M20 30V70M34 24V70M48 34V70M62 28V70"/><path d="M20 44Q41 38 62 44"/><path d="M4 72q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/><path d="M76 62q10-4 20 0t20 0"/>`,
  wave:`<path d="M4 48q14-10 28 0t28 0t28 0t28 0"/><path d="M4 60q14-10 28 0t28 0t28 0t28 0"/><path d="M4 72q14-10 28 0t28 0t28 0t28 0"/><circle cx="56" cy="24" r="6"/><path d="M56 30V42M50 36h12"/>`,
  mazu:`<circle cx="60" cy="20" r="7"/><path d="M50 18h20"/><path d="M52 30H68L74 66H46Z"/><path d="M44 66H76"/><path d="M4 72q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/><path d="M20 40q6-4 12 0M88 36q6-4 12 0"/>`,
  glow:`<path d="M4 56q14-8 28 0t28 0t28 0t28 0"/><path d="M4 68q14-8 28 0t28 0t28 0t28 0"/><circle cx="24" cy="50" r="1.5"/><circle cx="52" cy="52" r="1.5"/><circle cx="80" cy="50" r="1.5"/><circle cx="102" cy="52" r="1.5"/><path d="M84 16a12 12 0 1 0 8 20a10 10 0 0 1 -8 -20z"/><path d="M30 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>`,
  stone:`<path d="M20 70V42L54 26L88 42V70Z"/><path d="M20 52H88M20 62H88M36 42V52M54 42V52M70 42V52M28 52V62M46 52V62M62 52V62M78 52V62"/><path d="M96 70V48h14v22"/><path d="M6 76H114"/>`,
  palace:`<path d="M10 40Q60 26 110 40"/><path d="M22 34Q60 20 98 34"/><path d="M18 40V66M102 40V66M14 66H106"/><path d="M40 66V50H80V66"/><path d="M26 72H94"/>`,
  greatwall:`<path d="M4 60L24 44L44 52L64 30L84 40L116 22"/><path d="M4 70L24 54L44 62L64 40L84 50L116 32"/><path d="M60 34V24h8v8M20 48V38h8v8M80 42V32h8v8"/>`,
  tower:`<path d="M60 8L44 72M60 8L76 72"/><path d="M53 30H67M50 46H70M47 58H73"/><path d="M44 72Q60 54 76 72"/><path d="M28 72H92"/>`,
  twin:`<path d="M36 72V20l6-10 6 10v52M72 72V20l6-10 6 10v52"/><path d="M48 40H72"/><path d="M36 32h12M36 50h12M72 32h12M72 50h12"/><path d="M20 72H100"/>`,
  merlion:`<circle cx="46" cy="30" r="12"/><path d="M38 42Q36 60 54 70Q74 76 82 60Q70 64 62 56"/><path d="M58 28Q88 20 108 44"/><path d="M20 72H100"/>`,
  tree:`<path d="M30 72V36M60 72V24M90 72V40"/><path d="M18 36Q30 26 42 36M46 24Q60 12 74 24M78 40Q90 30 102 40"/><path d="M42 30H78"/><path d="M10 72H110"/>`,
  torii:`<path d="M14 22Q60 12 106 22"/><path d="M22 32H98"/><path d="M34 22V72M86 22V72"/><path d="M60 32V22"/><path d="M48 44H78M52 44V70M74 44V70"/><path d="M8 72H112"/>`,
  prang:`<path d="M60 6V16"/><path d="M50 72Q52 40 56 20H64Q68 40 70 72"/><path d="M52 38H68M51 54H69"/><path d="M26 72Q28 54 32 44H40Q44 54 46 72M74 72Q76 54 80 44H88Q92 54 94 72"/><path d="M14 72H106"/>`,
  stupa:`<path d="M60 10V18"/><path d="M52 30Q60 16 68 30Z"/><path d="M40 42H80V30H40Z"/><path d="M30 54H90V42H30Z"/><path d="M20 66H100V54H20Z"/><path d="M10 72H110"/>`,
  skyline:`<path d="M8 72H112"/><path d="M14 72V46H26V72M30 72V38H42V72"/><path d="M58 72V30L64 8L70 30V72"/><circle cx="64" cy="38" r="5"/><path d="M80 72V26Q86 16 92 26V72M96 72V44H108V72"/>`,
  panda:`<circle cx="60" cy="42" r="22"/><circle cx="42" cy="24" r="7"/><circle cx="78" cy="24" r="7"/><ellipse cx="51" cy="42" rx="5" ry="7"/><ellipse cx="69" cy="42" rx="5" ry="7"/><path d="M56 54q4 3 8 0"/><path d="M14 72V30M14 44l8-4M14 58l-8-4"/>`,
  warrior:`<circle cx="60" cy="16" r="7"/><path d="M50 10h20"/><path d="M48 26H72L76 56H44Z"/><path d="M48 56V72M72 56V72"/><path d="M44 30L36 48M76 30L84 48"/><path d="M20 72H100"/>`,
  citywall:`<path d="M6 72V40H114V72"/><path d="M6 40V32h8v8h8v-8h8v8h8v-8h8v8h8v-8h8v8h8v-8h8v8h8v-8h8v8h8v-8h8v8"/><path d="M48 72V58a12 12 0 0 1 24 0V72"/>`,
  arena:`<path d="M10 70V34Q60 14 110 34V70"/><path d="M10 46Q60 28 110 46M10 58Q60 42 110 58"/><path d="M22 70V62M34 70V60M46 70V58M58 70V58M70 70V58M82 70V60M94 70V62"/><path d="M4 72H116"/>`,
  fountain:`<path d="M20 50H100V60H20Z"/><path d="M60 50V24"/><path d="M60 24Q44 30 40 50M60 24Q76 30 80 50"/><path d="M50 16h20l-4 8H54Z"/><path d="M14 72q10-4 20 0t20 0t20 0t20 0t20 0"/>`,
  gondola:`<path d="M14 54Q60 70 106 46"/><path d="M76 48V20"/><path d="M76 20L70 62"/><path d="M90 40l8-10"/><path d="M4 70q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/>`,
  pyramid:`<path d="M20 70L60 22L100 70Z"/><path d="M40 46H80M30 58H90M60 22V70"/><path d="M8 72H112"/>`,
  volcano:`<path d="M4 72L42 26H78L116 72Z"/><path d="M42 26q6 8 12 0t12 0t12 0"/><path d="M50 16q-4-6 2-10M66 14q-4-6 2-10"/>`,
  karst:`<path d="M10 64Q12 34 24 30Q34 34 34 64"/><path d="M40 64Q42 20 58 16Q72 22 72 64"/><path d="M78 64Q80 40 92 36Q104 40 104 64"/><path d="M4 70q10-4 20 0t20 0t20 0t20 0t20 0t20 0"/><path d="M50 74l6-4h14"/>`,
  terrace:`<path d="M4 30Q40 24 60 30T116 30"/><path d="M4 44Q40 38 60 44T116 44"/><path d="M4 58Q40 52 60 58T116 58"/><path d="M4 72Q40 66 60 72T116 72"/><path d="M88 30V12M88 12q-8 2-10 8M88 12q8 0 12 6"/>`,
  castle:`<path d="M24 72V52H96V72"/><path d="M30 52L40 40H80L90 52"/><path d="M40 40V30H80V40"/><path d="M36 30Q60 20 84 30"/><path d="M48 30V22H72V30"/><path d="M44 22Q60 12 76 22"/><path d="M52 72V62H68V72"/>`,
  stairs:`<path d="M10 72Q30 10 60 12Q90 10 110 72"/><path d="M52 72L56 36H64L68 72"/><path d="M53 64h14M54 56h12M55 48h10M56 40h8"/><path d="M84 72V42l6-8 6 8v30"/>`,
  cape:`<circle cx="80" cy="44" r="12"/><path d="M4 56H116"/><path d="M4 56L24 36L46 44V56"/><path d="M12 64q10-4 20 0t20 0t20 0t20 0t20 0"/><path d="M60 72H100"/>`,
  bike:`<circle cx="36" cy="58" r="12"/><circle cx="84" cy="58" r="12"/><path d="M36 58L52 38H72L84 58M52 38L60 58H36M68 30h8"/><path d="M60 58L72 38"/><circle cx="56" cy="22" r="5"/><circle cx="70" cy="18" r="5"/>`,
  seoultower:`<path d="M60 6V22"/><path d="M52 22H68L66 34H54Z"/><path d="M56 34L54 70M64 34L66 70"/><path d="M14 72Q38 54 60 60Q84 52 106 72"/>`,
  train:`<path d="M34 14H86a10 10 0 0 1 10 10V60a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V24a10 10 0 0 1 10-10Z"/><path d="M32 26H88V44H32Z"/><path d="M24 52H96"/><circle cx="38" cy="59" r="3"/><circle cx="82" cy="59" r="3"/><path d="M40 68L30 78M80 68L90 78M20 78H100"/>`,
  compass:`<circle cx="60" cy="40" r="30"/><circle cx="60" cy="40" r="22" stroke-dasharray="2 4"/><path d="M60 18L66 40L60 62L54 40Z"/><path d="M60 6v6M60 68v6M26 40h6M88 40h6"/>`,
  recline:`<path d="M14 60Q40 44 80 50Q100 52 106 60Z"/><circle cx="26" cy="48" r="8"/><path d="M8 66H112"/><path d="M40 52q20-6 40 0"/>`
};

/* local check-in tasks: F = 吃, D = 做 */
const CTASKS={
 bj:["F吃一只北京烤鸭","F勇敢尝一口豆汁儿","F来一串冰糖葫芦","D在胡同里骑一段车","D听一段京剧或相声"],
 sh:["F吃一笼生煎或小笼包","F尝一碗葱油拌面","D在外滩看一次夜景","D坐一次轮渡过黄浦江","D在梧桐老马路上散散步"],
 hz:["F喝一杯西湖龙井","F尝一口东坡肉或西湖醋鱼","F吃一个葱包桧","D在断桥上走一走","D租一条小船游西湖"],
 xa:["F吃一个肉夹馍","F来一碗羊肉泡馍","F尝一碗biangbiang面","D在城墙上骑一段车","D逛一次回民街"],
 cd:["F吃一顿麻辣火锅","F尝一份钟水饺或龙抄手","D在公园里喝一杯盖碗茶","D看熊猫啃一次竹子","D看一场川剧变脸"],
 fz:["F吃一碗福州鱼丸","F尝一碗锅边糊","F喝一碗太平燕","D在三坊七巷找一面马鞍墙","D在西湖边慢慢走一圈"],
 xm:["F吃一碗沙茶面","F尝一口土笋冻，勇敢一点","F喝一碗花生汤","D在鼓浪屿听一段钢琴声","D在环岛路骑一次车"],
 qz:["F吃一碗面线糊","F卷一份润饼","F尝一碗石花膏","D试戴一次蟳埔簪花","D在西街望一眼双塔"],
 zz:["F吃一碗漳州卤面","F来一碗四果汤","F尝一份手抓面","D在土楼天井里抬头看天","D在老榕树下坐一坐"],
 ly:["F喝一碗客家擂茶","F尝一个芋子包","D走进土楼的中心天井","D数一数土楼有几层","D听土楼里的老人讲故事"],
 np:["F喝一泡武夷岩茶","F尝一道闽北笋干菜","D坐一次九曲溪竹筏","D爬一次天游峰","D在茶园里拍一张照片"],
 sm:["F吃一碗沙县拌面","F来一碗扁肉","F喝一碗泰宁擂茶","D坐船游一次大金湖","D找一面最红的丹霞崖壁"],
 nd:["F喝一杯福鼎白茶","F尝一个海蛎饼","D在滩涂拍一张光影照片","D爬一次太姥山","D在白水洋踩一次水"],
 pt:["F吃一碗莆田卤面","F尝一盘兴化米粉","F吃几颗当季荔枝或龙眼","D在妈祖祖庙许个平安愿","D在湄洲岛看一次海"],
 pn:["F吃一顿海鲜大排档","F尝一份当地紫菜","D夜里去海边找蓝眼泪","D在石头厝里喝一杯咖啡","D在海边捡一枚贝壳"],
 bkk:["F喝一碗冬阴功汤","F吃一份芒果糯米饭","F来一杯泰式奶茶","D坐一次突突车","D坐船从湄南河看郑王庙"],
 cm:["F吃一碗泰北咖喱面","F在夜市尝一份烤串","D逛一次周日夜市","D上一堂泰餐烹饪课","D爬上双龙寺的长台阶"],
 pk:["F吃一顿海鲜大餐","F喝一个冰椰子","D在神仙半岛看日落","D下水浮潜一次","D逛一次普吉老街"],
 ay:["F吃一碗大城船面","F尝一份拉丝甜饼","D骑单车逛一次遗址","D找到树根里的佛头","D坐船绕古城一圈"],
 sgc:["F吃一份海南鸡饭","F尝一次辣椒螃蟹","F喝一杯kopi配咖椰吐司","D在小贩中心吃一顿","D看一场滨海湾灯光秀"],
 kl:["F吃一份椰浆饭","F尝一碗肉骨茶","F喝一杯拉茶","D爬上黑风洞的彩色台阶","D看一次双子塔夜景"],
 pg:["F吃一盘槟城炒粿条","F尝一碗亚参叻沙","F喝一杯煎蕊","D找一幅街头壁画合影","D骑车逛一次乔治市"],
 ml:["F尝一份娘惹菜","F吃一份鸡饭粒","D逛一次鸡场街夜市","D坐一次花花三轮车","D在红屋前拍一张照片"],
 sb:["F吃一顿当地海鲜","F尝一碗沙巴面","D出海跳一次岛","D远眺一次京那巴鲁山","D看一次亚庇的日落"],
 tk:["F吃一碗拉面","F尝一份寿司","D在浅草寺求一支签","D走一次涩谷十字路口","D看一次东京塔夜景"],
 ky:["F吃一份抹茶甜点","F尝一锅汤豆腐","D穿和服走一段路","D走一段千本鸟居","D在鸭川边坐一坐"],
 os:["F吃一份章鱼烧","F尝一份大阪烧","F来一串炸串","D在道顿堀看霓虹夜景","D在大阪城公园散步"],
 fj:["F尝一碗山梨馎饦面","F买一份富士山造型点心","D拍一张富士山倒影","D泡一次看得见富士山的温泉","D在河口湖边散步"],
 se:["F吃一顿韩式烤肉","F来一份炸鸡配啤酒","F在广藏市场吃绿豆煎饼","D穿韩服逛一次景福宫","D在N首尔塔挂一把锁"],
 jj:["F吃一顿黑猪肉烤肉","F尝一个济州柑橘","D早起看一次城山日出","D沿偶来小路走一段","D看一次海女下海"],
 hn:["F吃一碗越南河粉","F喝一杯鸡蛋咖啡","F尝一份烤肉米线","D在还剑湖边散步","D看一场水上木偶戏"],
 hl:["F在船上吃一顿海鲜","F尝一份越南春卷","D坐船游一次下龙湾","D划一次皮划艇","D钻一次溶洞"],
 ha:["F吃一碗高楼面","F尝一个越南法棍","D在河上放一盏许愿灯","D走一次日本廊桥","D夜里看满街的灯笼"],
 bl:["F吃一份脏鸭餐","F尝一份印尼炒饭","F喝一杯巴厘岛咖啡","D在海神庙看日落","D在梯田荡一次秋千"],
 yg:["F尝一份菠萝蜜炖菜Gudeg","F吃一串沙爹","D在婆罗浮屠看日出","D学一次蜡染","D看一场皮影戏"],
 pa:["F吃一个刚出炉的可颂","F尝一个马卡龙","D在铁塔下野餐一次","D坐一次塞纳河游船","D在卢浮宫看一眼蒙娜丽莎"],
 rm:["F吃一份罗马培根蛋面","F来一球意式冰淇淋","F站在吧台喝一杯浓缩","D在许愿池抛一枚硬币","D走进一次斗兽场"],
 vc:["F尝一份墨鱼汁面","F喝一杯橙色的Spritz","D坐一次贡多拉","D看一眼叹息桥","D在小巷里迷一次路"]
};

/* one-of-a-kind rubber stamp per city */
function stampSVG(ck,date){
  const c=CITY[ck], k=COUNTRY[c.k];
  const sp=SPOTS.find(s=>s.c===ck), motif=ICON[sp?sp.icon:"mountain"]||"";
  const h=[...ck].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7), shape=h%4, u="s"+Math.random().toString(36).slice(2,8);
  const col=c.color, P=(r,a)=>[100+r*Math.cos(a),100+r*Math.sin(a)].map(v=>v.toFixed(1)).join(" ");
  let frame="";
  if(shape===0) frame=`<circle cx="100" cy="100" r="92" stroke-width="5"/><circle cx="100" cy="100" r="82" stroke-width="1.6"/>`;
  else if(shape===1){ let d="",n=26; for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2-Math.PI/2; d+=(i?` A11 11 0 0 1 ${P(88,a)}`:`M${P(88,a)}`); } frame=`<path d="${d}Z" stroke-width="4"/><circle cx="100" cy="100" r="80" stroke-width="1.6"/>`; }
  else if(shape===2){ const pts=r=>Array.from({length:8},(_,i)=>P(r,Math.PI/8+i*Math.PI/4)).join(" "); frame=`<polygon points="${pts(96)}" stroke-width="5"/><polygon points="${pts(86)}" stroke-width="1.6"/>`; }
  else frame=`<rect x="10" y="10" width="180" height="180" rx="16" stroke-width="5"/><rect x="20" y="20" width="160" height="160" rx="10" stroke-width="1.6"/>`;
  const top=`${c.en.toUpperCase()} · ${k.en.toUpperCase()}`, d=(date||"").replace(/-/g,".");
  return `<svg viewBox="0 0 200 200" class="stamp-svg" aria-label="${c.name}印章">
    <defs>
      <path id="${u}t" d="M33 100a67 67 0 1 1 134 0"/>
      <path id="${u}b" d="M24 100a76 76 0 0 0 152 0"/>
      <filter id="${u}f" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${h%60}" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="${(h>>3)%60}" result="w"/>
        <feColorMatrix in="w" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.75" result="m"/>
        <feComposite in="d" in2="m" operator="in"/>
      </filter>
    </defs>
    <g filter="url(#${u}f)" fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round">
      ${frame}
      <circle cx="100" cy="100" r="54" stroke-width="1.4" stroke-dasharray="2 4"/>
      <g fill="${col}" stroke="none" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" letter-spacing="1.5">
        <text font-size="13"><textPath href="#${u}t" startOffset="50%" text-anchor="middle">${top}</textPath></text>
        <text font-size="12"><textPath href="#${u}b" startOffset="50%" text-anchor="middle">${d}</textPath></text>
        <text x="30" y="104" font-size="12" text-anchor="middle">★</text><text x="170" y="104" font-size="12" text-anchor="middle">★</text>
        <text x="100" y="140" font-size="21" text-anchor="middle" font-family="Ma Shan Zheng, STKaiti, serif" letter-spacing="2">${c.name}</text>
      </g>
      <g transform="translate(70 66) scale(.5)" stroke-width="4.4">${motif}</g>
    </g>
  </svg>`;
}
export {COUNTRY,CITY,SPOTS,ICON,CTASKS,stampSVG};
