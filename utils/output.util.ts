/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import JSZip from 'jszip';
import JEpub from './jepub/jepub';

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
export function loadImage(file: any) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

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
export const base64ToBlob = (base64Data: any) => {
  console.log(
    '%c [ base64Data ]-52',
    'font-size:13px; background:pink; color:#bf2c9f;',
    base64Data
  );
  return fetch(base64Data)
    .then((response) => response.blob())
    .catch((error) => {
      console.error('Failed to convert Base64 to Image URL:', error);
    });
};

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
    title: form.values.name,
    author: form.values.author,
    publisher: '',
  });
  if (cover) {
    const file = await base64ToBlob(cover);
    console.log('%c [ file ]-93', 'font-size:13px; background:pink; color:#bf2c9f;', file);
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
