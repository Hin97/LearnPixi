/*!
 * @pixi/graphics-extras - v7.3.0-rc
 * Compiled Thu, 13 Jul 2023 16:12:56 UTC
 *
 * @pixi/graphics-extras is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
(function(graphics, core) {
  "use strict";
  function drawChamferRect(x, y, width, height, chamfer) {
    if (chamfer <= 0)
      return this.drawRect(x, y, width, height);
    const inset = Math.min(chamfer, Math.min(width, height) / 2), right = x + width, bottom = y + height, points = [
      x + inset,
      y,
      right - inset,
      y,
      right,
      y + inset,
      right,
      bottom - inset,
      right - inset,
      bottom,
      x + inset,
      bottom,
      x,
      bottom - inset,
      x,
      y + inset
    ];
    for (let i = points.length - 1; i >= 2; i -= 2)
      points[i] === points[i - 2] && points[i - 1] === points[i - 3] && points.splice(i - 1, 2);
    return this.drawPolygon(points);
  }
  function drawFilletRect(x, y, width, height, fillet) {
    if (fillet === 0)
      return this.drawRect(x, y, width, height);
    const maxFillet = Math.min(width, height) / 2, inset = Math.min(maxFillet, Math.max(-maxFillet, fillet)), right = x + width, bottom = y + height, dir = inset < 0 ? -inset : 0, size = Math.abs(inset);
    return this.moveTo(x, y + size).arcTo(x + dir, y + dir, x + size, y, size).lineTo(right - size, y).arcTo(right - dir, y + dir, right, y + size, size).lineTo(right, bottom - size).arcTo(right - dir, bottom - dir, x + width - size, bottom, size).lineTo(x + size, bottom).arcTo(x + dir, bottom - dir, x, bottom - size, size).closePath();
  }
  function drawRegularPolygon(x, y, radius, sides, rotation = 0) {
    sides = Math.max(sides | 0, 3);
    const startAngle = -1 * Math.PI / 2 + rotation, delta = Math.PI * 2 / sides, polygon = [];
    for (let i = 0; i < sides; i++) {
      const angle = i * delta + startAngle;
      polygon.push(
        x + radius * Math.cos(angle),
        y + radius * Math.sin(angle)
      );
    }
    return this.drawPolygon(polygon);
  }
  function drawRoundedPolygon(x, y, radius, sides, corner, rotation = 0) {
    if (sides = Math.max(sides | 0, 3), corner <= 0)
      return this.drawRegularPolygon(x, y, radius, sides, rotation);
    const sideLength = radius * Math.sin(Math.PI / sides) - 1e-3;
    corner = Math.min(corner, sideLength);
    const startAngle = -1 * Math.PI / 2 + rotation, delta = Math.PI * 2 / sides, internalAngle = (sides - 2) * Math.PI / sides / 2;
    for (let i = 0; i < sides; i++) {
      const angle = i * delta + startAngle, x0 = x + radius * Math.cos(angle), y0 = y + radius * Math.sin(angle), a1 = angle + Math.PI + internalAngle, a2 = angle - Math.PI - internalAngle, x1 = x0 + corner * Math.cos(a1), y1 = y0 + corner * Math.sin(a1), x3 = x0 + corner * Math.cos(a2), y3 = y0 + corner * Math.sin(a2);
      i === 0 ? this.moveTo(x1, y1) : this.lineTo(x1, y1), this.quadraticCurveTo(x0, y0, x3, y3);
    }
    return this.closePath();
  }
  function roundedShapeArc(g, points, radius) {
    var _a;
    const vecFrom = (p, pp) => {
      const x = pp.x - p.x, y = pp.y - p.y, len = Math.sqrt(x * x + y * y), nx = x / len, ny = y / len;
      return { len, nx, ny };
    }, sharpCorner = (i, p) => {
      i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y);
    };
    let p1 = points[points.length - 1];
    for (let i = 0; i < points.length; i++) {
      const p2 = points[i % points.length], pRadius = (_a = p2.radius) != null ? _a : radius;
      if (pRadius <= 0) {
        sharpCorner(i, p2), p1 = p2;
        continue;
      }
      const p3 = points[(i + 1) % points.length], v1 = vecFrom(p2, p1), v2 = vecFrom(p2, p3);
      if (v1.len < 1e-4 || v2.len < 1e-4) {
        sharpCorner(i, p2), p1 = p2;
        continue;
      }
      let angle = Math.asin(v1.nx * v2.ny - v1.ny * v2.nx), radDirection = 1, drawDirection = !1;
      v1.nx * v2.nx - v1.ny * -v2.ny < 0 ? angle < 0 ? angle = Math.PI + angle : (angle = Math.PI - angle, radDirection = -1, drawDirection = !0) : angle > 0 && (radDirection = -1, drawDirection = !0);
      const halfAngle = angle / 2;
      let cRadius, lenOut = Math.abs(
        Math.cos(halfAngle) * pRadius / Math.sin(halfAngle)
      );
      lenOut > Math.min(v1.len / 2, v2.len / 2) ? (lenOut = Math.min(v1.len / 2, v2.len / 2), cRadius = Math.abs(lenOut * Math.sin(halfAngle) / Math.cos(halfAngle))) : cRadius = pRadius;
      const cX = p2.x + v2.nx * lenOut + -v2.ny * cRadius * radDirection, cY = p2.y + v2.ny * lenOut + v2.nx * cRadius * radDirection, startAngle = Math.atan2(v1.ny, v1.nx) + Math.PI / 2 * radDirection, endAngle = Math.atan2(v2.ny, v2.nx) - Math.PI / 2 * radDirection;
      i === 0 && g.moveTo(
        cX + Math.cos(startAngle) * cRadius,
        cY + Math.sin(startAngle) * cRadius
      ), g.arc(cX, cY, cRadius, startAngle, endAngle, drawDirection), p1 = p2;
    }
  }
  function roundedShapeQuadraticCurve(g, points, radius) {
    var _a;
    const distance = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2), pointLerp = (p1, p2, t) => ({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    }), numPoints = points.length;
    for (let i = 0; i < numPoints; i++) {
      const thisPoint = points[(i + 1) % numPoints], pRadius = (_a = thisPoint.radius) != null ? _a : radius;
      if (pRadius <= 0) {
        i === 0 ? g.moveTo(thisPoint.x, thisPoint.y) : g.lineTo(thisPoint.x, thisPoint.y);
        continue;
      }
      const lastPoint = points[i], nextPoint = points[(i + 2) % numPoints], lastEdgeLength = distance(lastPoint, thisPoint);
      let start;
      if (lastEdgeLength < 1e-4)
        start = thisPoint;
      else {
        const lastOffsetDistance = Math.min(lastEdgeLength / 2, pRadius);
        start = pointLerp(
          thisPoint,
          lastPoint,
          lastOffsetDistance / lastEdgeLength
        );
      }
      const nextEdgeLength = distance(nextPoint, thisPoint);
      let end;
      if (nextEdgeLength < 1e-4)
        end = thisPoint;
      else {
        const nextOffsetDistance = Math.min(nextEdgeLength / 2, pRadius);
        end = pointLerp(
          thisPoint,
          nextPoint,
          nextOffsetDistance / nextEdgeLength
        );
      }
      i === 0 ? g.moveTo(start.x, start.y) : g.lineTo(start.x, start.y), g.quadraticCurveTo(thisPoint.x, thisPoint.y, end.x, end.y);
    }
  }
  function drawRoundedShape(points, radius, useQuadraticCurve) {
    return points.length < 3 ? this : (useQuadraticCurve ? roundedShapeQuadraticCurve(this, points, radius) : roundedShapeArc(this, points, radius), this.closePath());
  }
  class Star extends core.Polygon {
    /**
     * @param x - Center X position of the star
     * @param y - Center Y position of the star
     * @param points - The number of points of the star, must be > 1
     * @param radius - The outer radius of the star
     * @param innerRadius - The inner radius between points, default half `radius`
     * @param rotation - The rotation of the star in radians, where 0 is vertical
     */
    constructor(x, y, points, radius, innerRadius, rotation = 0) {
      innerRadius = innerRadius || radius / 2;
      const startAngle = -1 * Math.PI / 2 + rotation, len = points * 2, delta = core.PI_2 / len, polygon = [];
      for (let i = 0; i < len; i++) {
        const r = i % 2 ? innerRadius : radius, angle = i * delta + startAngle;
        polygon.push(
          x + r * Math.cos(angle),
          y + r * Math.sin(angle)
        );
      }
      super(polygon);
    }
  }
  function drawStar(x, y, points, radius, innerRadius, rotation = 0) {
    return this.drawPolygon(new Star(x, y, points, radius, innerRadius, rotation));
  }
  function drawTorus(x, y, innerRadius, outerRadius, startArc = 0, endArc = Math.PI * 2) {
    return Math.abs(endArc - startArc) >= Math.PI * 2 ? this.drawCircle(x, y, outerRadius).beginHole().drawCircle(x, y, innerRadius).endHole() : (this.finishPoly(), this.arc(x, y, innerRadius, endArc, startArc, !0).arc(x, y, outerRadius, startArc, endArc, !1).finishPoly(), this);
  }
  Object.defineProperties(graphics.Graphics.prototype, {
    drawTorus: { value: drawTorus },
    drawChamferRect: { value: drawChamferRect },
    drawFilletRect: { value: drawFilletRect },
    drawRegularPolygon: { value: drawRegularPolygon },
    drawRoundedPolygon: { value: drawRoundedPolygon },
    drawRoundedShape: { value: drawRoundedShape },
    drawStar: { value: drawStar }
  });
})(PIXI, PIXI);
//# sourceMappingURL=graphics-extras.js.map
