/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import JSZip from 'jszip';
import JEpub from './jepub/jepub';

export function loadImage(file: any) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export async function checkPaddingDouble(img: any, { loggerHandler, form }: any) {
  loggerHandler.append('开始检测padding...');

  const imgObj: any = await loadImage(img);
  const canvas = document.createElement('canvas');
  const context: any = canvas.getContext('2d');
  // 定义接近白色的颜色的阈值
  const whiteThreshold = 240;
  const blackThreshold = 60;
  // 将图片绘制到 Canvas
  canvas.width = imgObj.width;
  canvas.height = imgObj.height;
  context.drawImage(imgObj, 0, 0);

  // 获取 Canvas 上每个像素的颜色数据
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const tempRed = pixels[0];
  const tempGreen = pixels[1];
  const tempBlue = pixels[2];
  let middleFlag = 'white';
  let flag = 'white';
  if (form.values.autoDetectPaddingColor) {
    if (tempRed >= whiteThreshold && tempBlue >= whiteThreshold && tempGreen >= whiteThreshold) {
      flag = 'white';
    } else {
      flag = 'black';
    }
    const middleX = Math.floor(canvas.width / 2);
    const middleIndex = middleX * 4;
    const middleRed = pixels[middleIndex];
    const middleGreen = pixels[middleIndex + 1];
    const middleBlue = pixels[middleIndex + 2];
    if (
      middleRed >= whiteThreshold &&
      middleGreen >= whiteThreshold &&
      middleBlue >= whiteThreshold
    ) {
      middleFlag = 'white';
    } else {
      middleFlag = 'black';
    }
    loggerHandler.append(`检测两侧padding颜色为：${flag}`);
    loggerHandler.append(`检测中间padding颜色为：${middleFlag}`);
  } else {
    middleFlag = form.values.middlePaddingColor;
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

      // 判断像素是否接近白色
      const isWhite = red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold;
      const isBlack = red <= blackThreshold && green <= blackThreshold && blue <= blackThreshold;
      //   loggerHandler.append(`当前为第${x}列${y}行，rgb为：${red},${green},${blue}`);
      // 如果像素是白色，则留白宽度加一
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
  // console.log(leftMaxBlankWidth, rightMaxBlankWidth);
  let minPaddingWidth = Infinity;

  // 遍历图像像素数据，检测留白的宽度
  for (let x = Math.floor(canvas.width / 2); x >= 0; x--) {
    let isEmptyColumn = true;
    for (let y = 0; y < canvas.height; y++) {
      const index = (y * canvas.width + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (middleFlag === 'white') {
        // 判断是否是接近白色的像素
        if (
          red < whiteThreshold ||
          green < whiteThreshold ||
          blue < whiteThreshold ||
          alpha < whiteThreshold
        ) {
          isEmptyColumn = false;
          break;
        }
      } else if (
        red > blackThreshold ||
        green > blackThreshold ||
        blue > blackThreshold ||
        alpha > blackThreshold
      ) {
        isEmptyColumn = false;
        break;
      }
    }

    // 找到第一个非空列
    if (!isEmptyColumn) {
      const leftX = x;
      for (let i = Math.floor(canvas.width / 2); i < canvas.width; i++) {
        let isEmptyColumn: any = true;
        for (let y = 0; y < canvas.height; y++) {
          const index = (y * canvas.width + i) * 4;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];

          if (middleFlag === 'white') {
            // 判断是否是接近白色的像素
            if (
              red < whiteThreshold ||
              green < whiteThreshold ||
              blue < whiteThreshold ||
              alpha < whiteThreshold
            ) {
              isEmptyColumn = false;
              break;
            }
          } else if (
            red > blackThreshold ||
            green > blackThreshold ||
            blue > blackThreshold ||
            alpha > blackThreshold
          ) {
            isEmptyColumn = false;
            break;
          }
        }

        // 找到第一个非空列
        if (!isEmptyColumn) {
          const rightX = i;
          const paddingWidth = rightX - leftX;
          if (paddingWidth < minPaddingWidth) {
            minPaddingWidth = paddingWidth;
          }
          break;
        }
      }
      break;
    }
  }
  // console.log(
  //   '%c [ minPaddingWidth ]-625',
  //   'font-size:13px; background:pink; color:#bf2c9f;',
  //   minPaddingWidth
  // );
  //   loggerHandler.append(
  //     `检测结果为：左侧padding：${leftMaxBlankWidth}，右侧padding：${rightMaxBlankWidth}，颜色：${flag}。中间padding：${minPaddingWidth}，颜色：${middleFlag}`
  //   );

  return {
    leftPadding: leftMaxBlankWidth,
    rightPadding: rightMaxBlankWidth,
    middleWidth: minPaddingWidth,
  };
}

export async function checkPaddingSingle(img: any, { loggerHandler, form }: any) {
  loggerHandler.append('开始检测padding...');

  const imgObj: any = await loadImage(img);
  const canvas = document.createElement('canvas');
  const context: any = canvas.getContext('2d');
  // 定义接近白色的颜色的阈值
  const whiteThreshold = 240;
  const blackThreshold = 60;
  // 将图片绘制到 Canvas
  canvas.width = imgObj.width;
  canvas.height = imgObj.height;
  context.drawImage(imgObj, 0, 0);

  // 获取 Canvas 上每个像素的颜色数据
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
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

    loggerHandler.append(`检测两侧padding颜色为：${flag}`);
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

      // 判断像素是否接近白色
      const isWhite = red >= whiteThreshold && green >= whiteThreshold && blue >= whiteThreshold;
      const isBlack = red <= blackThreshold && green <= blackThreshold && blue <= blackThreshold;
      //   loggerHandler.append(`当前为第${x}列${y}行，rgb为：${red},${green},${blue}`);
      // 如果像素是白色，则留白宽度加一
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
  //   const range = `${min} - ${max}`;
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
export const base64ToBlob = (base64Data: any) => fetch(base64Data)
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
