/* eslint-disable */

import JSZip from 'jszip';
import JEpub from './jepub/jepub';
// import * as wasm from 'local-wasm-tool'
// let wasm = {}
// let checkWhiteBlack = () => {

// }
// //wasm.check_white_black;

// if (typeof window !== 'undefined') {
//   // 在客户端导入模块
//   const m = require('local-wasm-tool')

//   m.default().then(() => {
//     console.log('%c [ wasm ]-13', 'font-size:13px; background:pink; color:#bf2c9f;', m)
//     wasm = m
//     checkWhiteBlack = (col,
//       { whiteThreshold, blackThreshold, atLeastFrequency }) =>
//       m.check_white_black(col, whiteThreshold, blackThreshold, atLeastFrequency);
//   })

// }
// const r = wasm()
// wasm.default()
// console.log('%c [ r ]-9', 'font-size:13px; background:pink; color:#bf2c9f;', r)
// console.log('%c [ wasm ]-8', 'font-size:13px; background:pink; color:#bf2c9f;', wasm?.wasm?.check_white_black)
// if (typeof window !== 'undefined') {
//   console.log(wasm.check_white_black([244, 244, 244, 244], 200, 10, 1))

// }
// console.log('%c [ check_white_black ]-8', 'font-size:13px; background:pink; color:#bf2c9f;', cc)
export function loadImage(file: any) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}
export function fuzzRgb(n: number) {
  // return n
  // stop fuzz
  if (n < 0) return 0;
  if (n > 255) return 255;
  if (n < 10) return 10;
  // if (n < 100) {
  //   return Math.round(n / 10) * 10
  // }
  return Math.round(n / 10) * 10;
}

function genRGBTable(pixels: number[]) {
  const pLength = pixels.length;
  const frequencyMap: { [key: string]: number } = {};
  for (let i = 0; i < pLength; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const rgb = `${r},${g},${b}`;
    if (!(rgb in frequencyMap)) {
      frequencyMap[rgb] = 0;
    }
    frequencyMap[rgb]++;
  }
  return frequencyMap;
}
export function findMostFrequentRGB(pixels: number[]) {
  // const frequencyMap: any = {};

  const pLength = pixels.length;
  const frequencyMap = Object.create(null); // 使用原型为null的空对象，避免原型链查找的开销

  // 统计每个 RGB 值的频率
  for (let i = 0; i < pLength; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const rgb = `${r},${g},${b}`;
    if (!(rgb in frequencyMap)) {
      frequencyMap[rgb] = 0;
    }
    // if (rgb in frequencyMap) {
    //   frequencyMap[rgb]++;
    // } else {
    //   frequencyMap[rgb] = 1;
    // }
    frequencyMap[rgb]++;
  }

  // // 找到频率最高的 RGB 值
  // let maxFrequency = 0;
  // let mostFrequentRGB = '';

  // for (const rgb in frequencyMap) {
  //   if (frequencyMap[rgb] > maxFrequency) {
  //     maxFrequency = frequencyMap[rgb];
  //     mostFrequentRGB = rgb;
  //   }
  // }

  const entries = Object.entries(frequencyMap);
  const [mostFrequentRGB, maxFrequency] = entries.reduce(
    (prev, curr) => {
      if (curr[1] > prev[1]) {
        return curr;
      }
      return prev;
    },
    ['', 0]
  );

  // console.log('%c [ frequencyMap ]-30', 'font-size:13px; background:pink; color:#bf2c9f;', frequencyMap)

  return {
    rgb: mostFrequentRGB.split(',').map(Number),
    frequency: maxFrequency / (pixels.length / 4),
    frequencyMap,
  };
}
function getCol(x: number, pixels: number[], { height, width }: any) {
  const col = [];
  for (let y = 0; y < height; y++) {
    // 获取当前像素的颜色数据
    const index = (x + y * width) * 4;
    col.push(pixels[index]);
    col.push(pixels[index + 1]);
    col.push(pixels[index + 2]);
    col.push(pixels[index + 3]);
  }

  return col;
}
function getRow(y: number, pixels: number[], { height, width }: any) {
  return pixels.slice(y * width * 4, width * 4);
}
export function getColColor(col: number[]) {
  return findMostFrequentRGB(col).rgb;
}
function checkWhiteBlack(
  col: number[],
  { whiteThreshold, blackThreshold, atLeastFrequency = 1, colNumber = 0 }: any
) {
  const { frequencyMap } = findMostFrequentRGB(col);
  const newFrequencyMap: any = {
    white: 0,
    black: 0,
    other: 0,
  };
  Object.keys(frequencyMap).forEach((key) => {
    const [r, g, b] = key.split(',').map(Number);
    if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
      newFrequencyMap.white += frequencyMap[key];
    } else if (r <= blackThreshold && g <= blackThreshold && b <= blackThreshold) {
      newFrequencyMap.black += frequencyMap[key];
    } else {
      newFrequencyMap.other += frequencyMap[key];
    }
  });
  const whiteFrequency =
    newFrequencyMap.white / (newFrequencyMap.black + newFrequencyMap.white + newFrequencyMap.other);
  const blackFrequency =
    newFrequencyMap.black / (newFrequencyMap.black + newFrequencyMap.white + newFrequencyMap.other);
  if (whiteFrequency > atLeastFrequency) {
    return 'white';
  }
  if (blackFrequency > atLeastFrequency) {
    return 'black';
  }
  return 'other';
}
function isWhite(r, g, b, whiteThreshold) {
  return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
}
function getRGBByXY(x: number, y: number, pixels: number[], { height, width }: any) {
  const index = (x + y * width) * 4;
  return {
    r: pixels[index],
    g: pixels[index + 1],
    b: pixels[index + 2],
    a: pixels[index + 3],
  };
}
function checkPointBlackWhite(x, y, { pixels, whiteThreshold, blackThreshold, height, width }) {
  const { r, g, b } = getRGBByXY(x, y, pixels, { height, width });
  if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
    return 'white';
  }
  if (r <= blackThreshold && g <= blackThreshold && b <= blackThreshold) {
    return 'black';
  }
  return 'other';
}
function isWhiteCol(col: number[], { whiteThreshold, atLeastFrequency = 1, colNumber = 0 }: any) {
  const { frequencyMap } = findMostFrequentRGB(col);
  const newFrequencyMap: any = {
    white: 0,
    noneWhite: 0,
  };
  Object.keys(frequencyMap).forEach((key) => {
    const [r, g, b] = key.split(',').map(Number);
    if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
      newFrequencyMap.white += frequencyMap[key];
    } else {
      newFrequencyMap.noneWhite += frequencyMap[key];
    }
  });
  const newFrequency = newFrequencyMap.white / (newFrequencyMap.white + newFrequencyMap.noneWhite);
  return newFrequency >= atLeastFrequency;
  // const [r, g, b] = rgb;
  // if (r >= whiteThreshold &&
  //   g >= whiteThreshold &&
  //   b >= whiteThreshold &&
  //   frequency >= atLeastFrequency
  // ) {
  //   return true;
  // }
  // return false;
}
export function isBlackCol(col: number[], { blackThreshold, atLeastFrequency = 1 }: any) {
  const { frequencyMap } = findMostFrequentRGB(col);
  const newFrequencyMap: any = {
    black: 0,
    noneBlack: 0,
  };
  Object.keys(frequencyMap).forEach((key) => {
    const [r, g, b] = key.split(',').map(Number);
    if (r <= blackThreshold && g <= blackThreshold && b <= blackThreshold) {
      newFrequencyMap.black += frequencyMap[key];
    } else {
      newFrequencyMap.noneBlack += frequencyMap[key];
    }
  });
  const newFrequency = newFrequencyMap.black / (newFrequencyMap.black + newFrequencyMap.noneBlack);
  return newFrequency >= atLeastFrequency;
}
function getMaxPaddingWidthByRow(
  pixels: number[],
  { width, height, whiteThreshold, blackThreshold, flag, allowNoise }: any
) {
  let leftMaxBlankWidth = Infinity;
  let rightMaxBlankWidth = Infinity;
  console.time('getMaxPaddingWidthByRow');
  for (let y = 0; y < height; y++) {
    console.time('getMaxLeftPaddingWidthByRow');
    let leftRowBlankWidth = 0;
    for (let x = 0; x < width / 2; x++) {
      const pointColor = checkPointBlackWhite(x, y, {
        pixels,
        whiteThreshold,
        blackThreshold,
        height,
        width,
      });
      const isWhite = pointColor === 'white';
      const isBlack = pointColor === 'black';

      if (pointColor === 'other') {
        break;
      }
      if (flag === 'white') {
        if (isWhite) {
          leftRowBlankWidth++;
        } else {
          break;
        }
      } else if (isBlack) {
        leftRowBlankWidth++;
      } else {
        // 如果遇到非黑色像素，则停止遍历
        break;
      }
    }
    if (leftRowBlankWidth < leftMaxBlankWidth) {
      leftMaxBlankWidth = leftRowBlankWidth;
    }
    console.timeEnd('getMaxLeftPaddingWidthByRow');

    console.time('getMaxRightPaddingWidthByRow');
    let rightRowBlankWidth = 0;
    for (let x = width - 1; x > width / 2; x--) {
      const pointColor = checkPointBlackWhite(x, y, {
        pixels,
        whiteThreshold,
        blackThreshold,
        height,
        width,
      });
      const isWhite = pointColor === 'white';
      const isBlack = pointColor === 'black';

      if (pointColor === 'other') {
        break;
      }
      if (flag === 'white') {
        if (isWhite) {
          rightRowBlankWidth++;
        } else {
          break;
        }
      } else if (isBlack) {
        rightRowBlankWidth++;
      } else {
        // 如果遇到非黑色像素，则停止遍历
        break;
      }
    }
    if (rightRowBlankWidth < rightMaxBlankWidth) {
      rightMaxBlankWidth = rightRowBlankWidth;
    }
    console.timeEnd('getMaxRightPaddingWidthByRow');
  }
  if (leftMaxBlankWidth === Infinity) {
    leftMaxBlankWidth = 0;
  }
  if (rightMaxBlankWidth === Infinity) {
    rightMaxBlankWidth = 0;
  }
  // console.log('%c [ flag ]-96', 'font-size:13px; background:pink; color:#bf2c9f;', flag)

  console.timeEnd('getMaxPaddingWidthByRow');

  return {
    leftMaxBlankWidth,
    rightMaxBlankWidth,
  };
}
function getLeftMaxPaddingWidth(
  pixels: number[],
  { width, height, whiteThreshold, blackThreshold, flag, allowNoise }: any
) {
  console.time('getLeftMaxPaddingWidth');

  let blankWidth = 0;
  // console.log('%c [ flag ]-96', 'font-size:13px; background:pink; color:#bf2c9f;', flag)

  for (let x = 0; x < width / 2; x++) {
    const col = getCol(x, pixels, { width, height });
    // console.log("at: " + x)
    const colColor = checkWhiteBlack(col, {
      whiteThreshold,
      blackThreshold,
      atLeastFrequency: allowNoise,
      colNumber: x,
    });
    const isWhite = colColor === 'white';
    const isBlack = colColor === 'black';
    // console.log('%c [ colColor ]-237', 'font-size:13px; background:pink; color:#bf2c9f;', colColor)

    // // 判断像素是否接近白色
    // const isWhite = red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold;
    // const isBlack = red <= blackThreshold && green <= blackThreshold && blue <= blackThreshold;
    // //   loggerHandler.append(`当前为第${x}列${y}行，rgb为：${red},${green},${blue}`);
    // // 如果像素是白色，则留白宽度加一
    if (flag === 'white') {
      if (isWhite) {
        blankWidth++;
      } else {
        // 如果遇到非白色像素，则停止遍历
        break;
      }
    } else if (isBlack) {
      blankWidth++;
    } else {
      // 如果遇到非黑色像素，则停止遍历
      break;
    }
  }
  console.timeEnd('getLeftMaxPaddingWidth');

  return blankWidth;
}
function getRightMaxPaddingWidth(
  pixels: number[],
  { width, height, whiteThreshold, blackThreshold, flag, allowNoise }: any
) {
  console.time('getRightMaxPaddingWidth');

  let blankWidth = 0;
  for (let x = width - 1; x >= width / 2; x--) {
    const col = getCol(x, pixels, { width, height });
    const colColor = checkWhiteBlack(col, {
      whiteThreshold,
      blackThreshold,
      atLeastFrequency: allowNoise,
      colNumber: x,
    });
    const isWhite = colColor === 'white';
    const isBlack = colColor === 'black';

    // // 判断像素是否接近白色
    // const isWhite = red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold;
    // const isBlack = red <= blackThreshold && green <= blackThreshold && blue <= blackThreshold;
    // //   loggerHandler.append(`当前为第${x}列${y}行，rgb为：${red},${green},${blue}`);
    // // 如果像素是白色，则留白宽度加一
    if (flag === 'white') {
      if (isWhite) {
        blankWidth++;
      } else {
        // 如果遇到非白色像素，则停止遍历
        break;
      }
    } else if (isBlack) {
      blankWidth++;
    } else {
      // 如果遇到非黑色像素，则停止遍历
      break;
    }
  }
  console.timeEnd('getRightMaxPaddingWidth');

  return blankWidth;
}
function getMiddleMaxPaddingWidth(
  pixels: number[],
  { width, height, whiteThreshold, blackThreshold, flag, allowNoise }: any
) {
  console.time('getMiddleMaxPaddingWidth');

  let minPaddingWidth = Infinity;
  let leftX = 0;
  let rightX = 0;
  console.time('checkLeftX');

  for (let x = Math.floor(width / 2); x >= 0; x--) {
    let isEmptyColumn = true;
    const col = getCol(x, pixels, { width, height });
    const colColor = checkWhiteBlack(col, {
      whiteThreshold,
      blackThreshold,
      atLeastFrequency: allowNoise,
      colNumber: x,
    });
    // console.log('%c [ colColor ]-274', 'font-size:13px; background:pink; color:#bf2c9f;', colColor)

    const isWhite = colColor === 'white';
    const isBlack = colColor === 'black';
    if (colColor === 'other') {
      isEmptyColumn = false;
    } else if (flag === 'white' && isBlack) {
      isEmptyColumn = false;
    } else if (flag === 'black' && isWhite) {
      isEmptyColumn = false;
    }
    // 找到第一个非空列
    if (!isEmptyColumn) {
      leftX = x;
      break;
    }
  }
  console.timeEnd('checkLeftX');

  if (leftX !== 0) {
    console.time('checkRightX');

    for (let i = Math.floor(width / 2); i < width; i++) {
      let isEmptyColumn: any = true;
      const rightCol = getCol(i, pixels, { width, height });
      const colColor = checkWhiteBlack(rightCol, {
        whiteThreshold,
        blackThreshold,
        atLeastFrequency: allowNoise,
      });
      const isRightWhite = colColor === 'white';
      // console.log('%c [ colColor ]-274', 'font-size:13px; background:pink; color:#bf2c9f;', colColor)
      const isRightBlack = colColor === 'black';
      // const isRightWhite = isWhiteCol(rightCol, { whiteThreshold, atLeastFrequency: allowNoise });
      // const isRightBlack = isBlackCol(rightCol, { blackThreshold, atLeastFrequency: allowNoise });

      if (colColor === 'other') {
        isEmptyColumn = false;
      } else if (flag === 'white' && isRightBlack) {
        isEmptyColumn = false;
      } else if (flag === 'black' && isRightWhite) {
        isEmptyColumn = false;
      }

      // 找到第一个非空列
      if (!isEmptyColumn) {
        rightX = i;

        break;
      }
    }
    console.timeEnd('checkRightX');
  }

  if (leftX !== 0 && rightX !== 0) {
    const paddingWidth = rightX - leftX;
    console.log(
      '%c [ paddingWidth ]-298',
      'font-size:13px; background:pink; color:#bf2c9f;',
      paddingWidth
    );
    if (paddingWidth < minPaddingWidth) {
      minPaddingWidth = paddingWidth;
    }
  }
  console.timeEnd('getMiddleMaxPaddingWidth');

  return minPaddingWidth;
}
export async function checkImgInfo(img: any, { loggerHandler, form, isCheckMiddle = false }: any) {
  loggerHandler.append('开始检测padding...');
  console.time('up');

  console.time('checkImgInfo');
  const { top, left, right, bottom } = form.values.positionFix;
  console.time('draw');

  const imgObj: any = await loadImage(img);
  const canvas = document.createElement('canvas');
  const context: any = canvas.getContext('2d');
  // 定义接近白色的颜色的阈值
  const { whiteThreshold } = form.values;
  const { blackThreshold } = form.values;
  // 将图片绘制到 Canvas
  canvas.width = imgObj.width - left - right;
  canvas.height = imgObj.height - top - bottom;
  context.drawImage(
    imgObj,
    left,
    top,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 获取 Canvas 上每个像素的颜色数据
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  // console.timeEnd('draw');
  // console.time('baseColor');

  const pixels = imageData.data;
  // const col = getCol(0, pixels, { width: canvas.width, height: canvas.height });
  // const test = wasm.fe_find_most_frequent_rgb(col)
  // console.log(wasm.check_white_black([244, 244, 244, 244], 200, 10, 1))

  // console.log('%c [ test ]-416', 'font-size:13px; background:pink; color:#bf2c9f;', test)
  // const baseColor: number[] = findMostFrequentRGB(pixels).rgb;
  const baseColor: number[] = [255, 255, 255]; // test.split(',').map(Number);
  // console.log('%c [ baseColor ]-404', 'font-size:13px; background:pink; color:#bf2c9f;', baseColor)
  // console.timeEnd('baseColor');

  // const tempRed = pixels[0];
  // const tempGreen = pixels[1];
  // const tempBlue = pixels[2];
  let middleFlag = 'white';
  let flag = 'white';
  // console.time('checkColor');

  if (form.values.autoDetectPaddingColor) {
    const leftFirstCol = getCol(0, pixels, { width: canvas.width, height: canvas.height });
    const isLeftPaddingWhite = isWhiteCol(leftFirstCol, {
      whiteThreshold,
      atLeastFrequency: form.values.allowNoise,
    });
    if (isLeftPaddingWhite) {
      flag = 'white';
    } else {
      flag = 'black';
    }
    // if (tempRed >= whiteThreshold && tempBlue >= whiteThreshold && tempGreen >= whiteThreshold) {
    //   flag = 'white';
    // } else {
    //   flag = 'black';
    // }
    const middleX = Math.floor(canvas.width / 2);
    const middleCol = getCol(middleX, pixels, { width: canvas.width, height: canvas.height });
    const isMiddlePaddingWhite = isWhiteCol(middleCol, {
      whiteThreshold,
      atLeastFrequency: form.values.allowNoise,
    });
    if (isMiddlePaddingWhite) {
      middleFlag = 'white';
    } else {
      middleFlag = 'black';
    }
    // const middleIndex = middleX * 4;
    // const middleRed = pixels[middleIndex];
    // const middleGreen = pixels[middleIndex + 1];
    // const middleBlue = pixels[middleIndex + 2];
    // if (
    //   middleRed >= whiteThreshold &&
    //   middleGreen >= whiteThreshold &&
    //   middleBlue >= whiteThreshold
    // ) {
    //   middleFlag = 'white';
    // } else {
    //   middleFlag = 'black';
    // }
    loggerHandler.append(`检测两侧padding颜色为：${flag}`);
    loggerHandler.append(`检测中间padding颜色为：${middleFlag}`);
  } else {
    middleFlag = form.values.middlePaddingColor;
    flag = form.values.paddingColor;
  }
  // console.timeEnd('checkColor');
  // console.timeEnd('up');
  // console.time('down');
  const { leftMaxBlankWidth, rightMaxBlankWidth } = getMaxPaddingWidthByRow(pixels, {
    width: canvas.width,
    height: canvas.height,
    whiteThreshold,
    blackThreshold,
    flag,
  });
  // // 定义最大的左侧留白宽度
  // const leftMaxBlankWidth = getLeftMaxPaddingWidth(
  //   pixels,
  //   {
  //     width: canvas.width,
  //     height: canvas.height,
  //     whiteThreshold,
  //     blackThreshold,
  //     flag,
  //     allowNoise: form.values.allowNoise,
  //   }
  // );
  // // 定义最大的右侧留白宽度
  // const rightMaxBlankWidth = getRightMaxPaddingWidth(
  //   pixels,
  //   {
  //     width: canvas.width,
  //     height: canvas.height,
  //     whiteThreshold,
  //     blackThreshold,
  //     flag,
  //     allowNoise: form.values.allowNoise,
  //   });

  let minPaddingWidth = Infinity;
  if (isCheckMiddle) {
    minPaddingWidth = getMiddleMaxPaddingWidth(pixels, {
      width: canvas.width,
      height: canvas.height,
      whiteThreshold,
      blackThreshold,
      flag,
      allowNoise: form.values.allowNoise,
    });
    // // 遍历图像像素数据，检测留白的宽度
    // for (let x = Math.floor(canvas.width / 2); x >= 0; x--) {
    //   let isEmptyColumn = true;
    //   for (let y = 0; y < canvas.height; y++) {
    //     const index = (y * canvas.width + x) * 4;
    //     const red = pixels[index];
    //     const green = pixels[index + 1];
    //     const blue = pixels[index + 2];
    //     const alpha = pixels[index + 3];
    //     if (middleFlag === 'white') {
    //       // 判断是否是接近白色的像素
    //       if (
    //         red < whiteThreshold ||
    //         green < whiteThreshold ||
    //         blue < whiteThreshold ||
    //         alpha < whiteThreshold
    //       ) {
    //         isEmptyColumn = false;
    //         break;
    //       }
    //     } else if (
    //       red > blackThreshold ||
    //       green > blackThreshold ||
    //       blue > blackThreshold ||
    //       alpha > blackThreshold
    //     ) {
    //       isEmptyColumn = false;
    //       break;
    //     }
    //   }

    //   // 找到第一个非空列
    //   if (!isEmptyColumn) {
    //     const leftX = x;
    //     for (let i = Math.floor(canvas.width / 2); i < canvas.width; i++) {
    //       let isEmptyColumn: any = true;
    //       for (let y = 0; y < canvas.height; y++) {
    //         const index = (y * canvas.width + i) * 4;
    //         const red = pixels[index];
    //         const green = pixels[index + 1];
    //         const blue = pixels[index + 2];
    //         const alpha = pixels[index + 3];

    //         if (middleFlag === 'white') {
    //           // 判断是否是接近白色的像素
    //           if (
    //             red < whiteThreshold ||
    //             green < whiteThreshold ||
    //             blue < whiteThreshold ||
    //             alpha < whiteThreshold
    //           ) {
    //             isEmptyColumn = false;
    //             break;
    //           }
    //         } else if (
    //           red > blackThreshold ||
    //           green > blackThreshold ||
    //           blue > blackThreshold ||
    //           alpha > blackThreshold
    //         ) {
    //           isEmptyColumn = false;
    //           break;
    //         }
    //       }

    //       // 找到第一个非空列
    //       if (!isEmptyColumn) {
    //         const rightX = i;
    //         const paddingWidth = rightX - leftX;
    //         if (paddingWidth < minPaddingWidth) {
    //           minPaddingWidth = paddingWidth;
    //         }
    //         break;
    //       }
    //     }
    //     break;
    //   }
    // }
  }
  // console.timeEnd('down');

  // console.timeEnd('checkImgInfo');
  console.log({
    leftPadding: leftMaxBlankWidth,
    rightPadding: rightMaxBlankWidth,
    middleWidth: isCheckMiddle ? (minPaddingWidth === Infinity ? 0 : minPaddingWidth) : 0,
    baseColor,
  });
  return {
    leftPadding: leftMaxBlankWidth,
    rightPadding: rightMaxBlankWidth,
    middleWidth: isCheckMiddle ? (minPaddingWidth === Infinity ? 0 : minPaddingWidth) : 0,
    baseColor,
  };
}

export async function checkPaddingSingle(img: any, { loggerHandler, form }: any) {
  loggerHandler.append('开始检测padding...');
  const { top, left, right, bottom } = form.values.positionFix;
  const imgObj: any = await loadImage(img);
  const canvas = document.createElement('canvas');
  const context: any = canvas.getContext('2d');
  // 定义接近白色的颜色的阈值
  const { whiteThreshold } = form.values;
  const { blackThreshold } = form.values;
  // 将图片绘制到 Canvas
  canvas.width = imgObj.width - left - right;
  canvas.height = imgObj.height - top - bottom;
  context.drawImage(
    imgObj,
    left,
    top,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 获取 Canvas 上每个像素的颜色数据
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const baseColor: number[] = findMostFrequentRGB(pixels).rgb;
  const tempRed = pixels[0];
  const tempGreen = pixels[1];
  const tempBlue = pixels[2];
  let flag = 'white';
  if (form.values.autoDetectPaddingColor) {
    if (tempRed >= whiteThreshold && tempBlue >= whiteThreshold && tempGreen >= whiteThreshold) {
      flag = 'white';
    } else {
      flag = 'black';
    }

    loggerHandler.append(`检测两侧padding颜色为：${flag},${tempRed},${tempGreen},${tempBlue}`);
    // console.log(`检测两侧padding颜色为：${flag},${tempRed},${tempGreen},${tempBlue}`)
  } else {
    flag = form.values.paddingColor;
  }

  // 定义最大的左侧留白宽度
  let leftMaxBlankWidth = canvas.width / 2;
  // 定义最大的右侧留白宽度
  let rightMaxBlankWidth = canvas.width / 2;
  // 遍历像素数据，检测左侧留白的宽度
  for (let y = 0; y < canvas.height; y++) {
    let blankWidth = 0;

    for (let x = 0; x < canvas.width / 2; x++) {
      // 获取当前像素的颜色数据
      const index = (x + y * canvas.width) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];

      const blue = pixels[index + 2];
      // console.log(`(${red},${green},${blue})`)
      // 判断像素是否接近白色
      const isWhite = red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold;
      const isBlack = red <= blackThreshold && green <= blackThreshold && blue <= blackThreshold;

      // console.log('%c [ isBlack ]-288', 'font-size:13px; background:pink; color:#bf2c9f;', isBlack)
      //   loggerHandler.append(`当前为第${ x }列${ y }行，rgb为：${ red }, ${ green }, ${ blue }`);
      // 如果像素是白色，则留白宽度加一
      if (flag === 'white') {
        if (isWhite) {
          blankWidth++;
        } else {
          // console.log(`(${red},${green},${blue}),(${x},${y})`);

          // 如果遇到非白色像素，则停止遍历
          break;
        }
      } else if (isBlack) {
        blankWidth++;
      } else {
        // console.log(`(${red},${green},${blue}),(${x},${y})`);

        // 如果遇到非黑色像素，则停止遍历
        break;
      }
    }
    // console.log('%c [ blankWidth ]-308', 'font-size:13px; background:pink; color:#bf2c9f;', blankWidth)

    // 更新最大的左侧留白宽度
    if (blankWidth < leftMaxBlankWidth) {
      leftMaxBlankWidth = blankWidth;
    }

    let rightBlankWidth = 0;
    for (let x = canvas.width - 1; x >= canvas.width / 2; x--) {
      // 获取当前像素的颜色数据
      const index = (x + y * canvas.width) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];

      // 判断像素是否接近白色
      const isWhite = red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold;
      const isBlack = red <= blackThreshold && green <= blackThreshold && blue <= blackThreshold;

      if (flag === 'white') {
        if (isWhite) {
          rightBlankWidth++;
        } else {
          // 如果遇到非白色像素，则停止遍历
          break;
        }
      } else if (isBlack) {
        rightBlankWidth++;
      } else {
        // 如果遇到非黑色像素，则停止遍历
        break;
      }
    }

    // 更新最大的右侧留白宽度
    if (rightBlankWidth < rightMaxBlankWidth) {
      rightMaxBlankWidth = rightBlankWidth;
    }
  }

  return {
    leftPadding: leftMaxBlankWidth,
    rightPadding: rightMaxBlankWidth,
    middleWidth: 0,
    baseColor,
  };
}
export function getRandomSamples(array: any[]) {
  const indices = Array.from(Array(array.length).keys()); // 创建下标数组
  const randomIndices = [];
  let sampleSize: number;
  if (indices.length > 10) {
    sampleSize = Math.ceil(indices.length / 3);
  } else {
    return indices;
  }
  // 从下标数组中随机选择样本
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < sampleSize; i++) {
    // 生成随机索引值
    const randomIndex = Math.floor(Math.random() * indices.length);
    const index = indices[randomIndex];

    // 从数组中获取对应的样本值
    randomIndices.push(index);

    // 从下标数组中移除已经选择的样本索引
    indices.splice(randomIndex, 1);
  }

  return randomIndices;
}
export function calcSample(array: any) {
  const sortedArray = array.slice().sort((a: any, b: any) => a - b);
  const trimmedArray = sortedArray.slice(1, sortedArray.length - 1);
  const sum = trimmedArray.reduce((acc: any, val: any) => acc + val, 0);
  const average = sum / trimmedArray.length;
  //   const min = trimmedArray[0];
  //   const max = trimmedArray[trimmedArray.length - 1];
  //   const range = `${ min } - ${ max }`;
  return Math.ceil(average);
}

export const base64ToImageUrl = (base64Data: any) =>
  fetch(base64Data)
    .then((response) => response.blob())
    .then((blob) => URL.createObjectURL(blob))
    .catch((error) => {
      console.error('Failed to convert Base64 to Image URL:', error);
    });

export function readFile(file: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // 文件读取成功
    reader.onload = () => {
      resolve(reader.result);
    };

    // 文件读取失败
    reader.onerror = () => {
      reject(new Error('无法读取文件'));
    };

    // 读取文件内容
    reader.readAsArrayBuffer(file);
  });
}
export const base64ToBlob = (base64Data: any) =>
  fetch(base64Data)
    .then((response) => response.blob())
    .catch((error) => {
      console.error('Failed to convert Base64 to Image URL:', error);
    });

export async function saveCBZ(resultImgs: any, cover: any) {
  const zip = new JSZip();
  if (cover) {
    zip.file('000_cover.jpg', cover.split(',')[1], { base64: true });
  }
  // Create a link element for each processed image
  resultImgs.forEach((img: any) => {
    zip.file(`${img.name}`, img.file.split(',')[1], {
      base64: true,
    });
  });

  //   await executeSequentially(promiseList);
  zip.generateAsync({ type: 'blob' }).then((blob) => {
    // 创建一个下载链接，设置文件名为 "images.cbz"
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'images.cbz';

    // 将下载链接添加到页面，并自动点击进行下载
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  });
}
export async function saveEpub(form: any, resultImgs: any, cover: any) {
  const jepub = new JEpub();
  jepub.init({
    i18n: 'en', // Internationalization
    title: form.values.fileName,
    author: form.values.author,
    publisher: '',
  });
  if (cover) {
    const file = await base64ToBlob(cover);
    jepub.cover(file);
  }
  for (const img of resultImgs) {
    const file = await base64ToBlob(img.file);
    jepub.image(file, img.name);
    jepub.add(
      img.name,
      `
        <%= image['${img.name}'] %>
        `
    );
  }

  const blob = await jepub.generate('blob');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  document.body.appendChild(link);
  link.href = url;
  link.download = `${form.values.fileName}.epub`;
  link.click();
  document.body.removeChild(link);
}
