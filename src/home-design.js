// Declarative finishes are the first customization layer; functional anchors stay fixed.
export const homeStyles = Object.freeze({
  willow: {label:'Willow · sage & oak',floor:'#d5c8af',wall:'#668880',fabric:'#91b2b1',sofa:'#8aa59a'},
  coastal: {label:'Coastal · blue & pale ash',floor:'#dce0d4',wall:'#648caa',fabric:'#9cbacf',sofa:'#7f9fb6'},
  terracotta: {label:'Terracotta · clay & walnut',floor:'#c3a88d',wall:'#b18470',fabric:'#c7a08e',sofa:'#ad8378'},
});
export function homeStyle(b) { return homeStyles[b.interiorStyle] || homeStyles.willow; }
export function setHomeStyle(b,style) {
  if(b.type!=='home'||!Object.hasOwn(homeStyles,style))return false;
  b.interiorStyle=style;return true;
}
