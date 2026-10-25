'use strict';
// Authored minimal parser fixtures; these are not real captured pages.

const pages = [
 ['public_input_sources/ken_jee-verified-about.html','UCiT9RITQ9PW6BhXK0y2jaeg','Ken Jee','@KenJee_ds'],
 ['public_input_sources/ken_jee-about.html','UCNFLBcdchuJ1SbfBAvV3gjw','Different Ken Jee','@KenJee'],
 ['public_input_sources/saurabhschool-about.html','UCZSfwNcYIpqO8B9wnBg4HWA','saurabhschool','@saurabhschool'],
 ['public_input_sources/general_shale-about.html','UC9UFpCljyEsj4kQ9CjvoPYQ','GeneralShaleBrick','@GeneralShaleBrick'],
 ['public_input_sources/mrbeast-about.html','UCX6OQ3DkcsbYNE6H8uQQuVA','MrBeast','@MrBeast'],
 ['public_input_sources/stem-about.html','UCmJ64or5eH-aYZs9Ogohq0A','Synthetic STEM','@SiguemeLaCorriente'],
 ['public_input_sources/breakway-about.html','UCO3LHqYvA9KRby_BSE0ndaQ','Synthetic Breakway','@BreakwayYT'],
 ['matched_control_sources/nation-about.html','UCX819jN5Te5_GKRgfdIB37g','Synthetic Nation','@NationMun-958'],
 ['matched_control_sources/bears-about.html','UCFjQUtG2TNclzWQdD-RIM1g','Synthetic Bears','@BearsandPandas'],
 ['matched_control_sources/marin-about.html','UCiD4JVMf9z7YiO2lj_f6uew','Fire Safe Marin','@FIRESafeMARIN'],
];
function fixture(file) {
 const page = pages.find(p=>p[0]===file);
 if (!page) throw new Error('Unknown synthetic fixture: '+file);
 const [,id,title,handle]=page;
 const data={metadata:{channelMetadataRenderer:{externalId:id,title}},contents:{aboutChannelViewModel:{channelId:id,canonicalChannelUrl:'https://www.youtube.com/'+handle,subscriberCountText:'12.3K subscribers',viewCountText:'123,456 views',videoCountText:'42 videos'}}};
 return '<!doctype html><script>var ytInitialData = '+JSON.stringify(data)+';</script>';
}
module.exports={fixture};
