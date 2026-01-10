let result = 'People in some countries / are so poor';

console.log('初期:', result);

// ルール8
const preps = 'at|in|on|by|from|for|with|about|of|during|after|before|around|per|near|under|over|through|into|onto|upon|without|within|among|between|behind|beside|below|above|across|along|against|beyond|past|since|until|towards?|throughout|underneath';
result = result.replace(
  new RegExp(`(?<!/)\\s+(${preps})\\s+`, 'gi'),
  ' / $1 '
);

console.log('ルール8後:', result);
