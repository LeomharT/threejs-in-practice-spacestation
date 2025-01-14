uniform float opacity;
uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
	vec2 uv = vUv;

	float offsetVolume = 0.0002;

	vec2 offset = vec2(offsetVolume, offsetVolume);

	float r = texture2D(tDiffuse, uv).r;
	float g = texture2D(tDiffuse, vec2(uv.x - offset.x, uv.y + offset.y)).g;
	float b = texture2D(tDiffuse, vec2(uv.x + offset.x, uv.y - offset.y)).b;

	vec4 color = vec4(r, g, b, opacity);

	gl_FragColor = color;
}
