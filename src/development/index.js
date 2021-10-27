import parse from '../parse';
import generateSVG from '../visualization';

document.getElementById('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const { value } = event.target.elements.helm;
  const parsedStr = parse(value);
  const svg = generateSVG(parsedStr, undefined, 0, true);

  document.getElementById('result').innerHTML = svg.outerHTML;
});
