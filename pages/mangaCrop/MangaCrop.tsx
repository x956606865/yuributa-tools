/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-shadow */
import JSZip from 'jszip';

import {
  Accordion,
  Center,
  Container,
  Group,
  rem,
  ScrollArea,
  Select,
  Text,
  Title,
  Image as MImage,
  useMantineTheme,
  SimpleGrid,
  AspectRatio,
  Button,
  Switch,
  Box,
  Slider,
  Radio,
  LoadingOverlay,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useListState } from '@mantine/hooks';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons';
import { sortBy, uniq, uniqBy } from 'lodash';
import { useEffect, useState } from 'react';

function loadImage(file: any) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}
const base64ToImageUrl = (base64Data: any) =>
  fetch(base64Data)
    .then((response) => response.blob())
    .then((blob) => URL.createObjectURL(blob))
    .catch((error) => {
      console.error('Failed to convert Base64 to Image URL:', error);
    });
async function checkPadding(img: any, { loggerHandler, form }: any) {
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
          console.log(
            '%c [ rightX ]-634',
            'font-size:13px; background:pink; color:#bf2c9f;',
            rightX
          );
          console.log('%c [ leftX ]-636', 'font-size:13px; background:pink; color:#bf2c9f;', leftX);

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
function readFile(file: any) {
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
function calcSample(array: any) {
  const sortedArray = array.slice().sort((a: any, b: any) => a - b);
  const trimmedArray = sortedArray.slice(1, sortedArray.length - 1);
  const sum = trimmedArray.reduce((acc: any, val: any) => acc + val, 0);
  const average = sum / trimmedArray.length;
  //   const min = trimmedArray[0];
  //   const max = trimmedArray[trimmedArray.length - 1];
  //   const range = `${min} - ${max}`;
  return Math.ceil(average);
}
async function processImages2(imgList: any, targetImgSize: any, { loggerHandler, form }: any) {
  const checkMethod = form.values.paddingCheckMethod;
  const paddingResult: any = {};
  if (imgList.length === 0) {
    return [];
  }
  if (checkMethod === 'sample') {
    let sampleIndex;
    if (imgList.length > 3) {
      sampleIndex = uniq([2, 3, Math.ceil(imgList.length / 2), imgList.length - 2]);
    } else {
      sampleIndex = [0];
    }
    const r: any = {
      leftPadding: [],
      rightPadding: [],
      middleWidth: [],
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const i of sampleIndex) {
      const img = imgList[i];
      // eslint-disable-next-line no-await-in-loop
      const { leftPadding, rightPadding, middleWidth } = await checkPadding(img, {
        loggerHandler,
        form,
      });
      r.leftPadding.push(leftPadding);
      r.rightPadding.push(rightPadding);
      r.middleWidth.push(middleWidth);
    }
    if (sampleIndex.length > 3) {
      paddingResult.leftPadding = calcSample(r.leftPadding);
      paddingResult.rightPadding = calcSample(r.rightPadding);
      paddingResult.middleWidth = calcSample(r.middleWidth);
    } else {
      paddingResult.leftPadding = r.leftPadding[0];
      paddingResult.rightPadding = r.rightPadding[0];
      paddingResult.middleWidth = r.middleWidth[0];
    }
  }
  const promises = imgList.map(async (img: any, index: any) => {
    console.log(`process images ${index + 1}/${imgList.length}`);
    loggerHandler.append(`process images ${index}/${imgList.length}`);
    let leftPadding;
    let rightPadding;
    let middleWidth;
    if (form.values.paddingCheckMethod === 'sample') {
      ({ leftPadding, rightPadding, middleWidth } = paddingResult);
    } else {
      ({ leftPadding, rightPadding, middleWidth } = await checkPadding(img, {
        form,
        loggerHandler,
      }));
    }
    loggerHandler.append(`使用的padding为：${leftPadding},${rightPadding},${middleWidth}`);

    if (img.name.includes('cover')) {
      const paddings = await checkPadding(img, {
        form,
        loggerHandler,
      });
      loggerHandler.append(
        `Cover 使用的padding为：${paddings.leftPadding},${paddings.rightPadding},${paddings.middleWidth}`
      );

      const imgObj: any = await loadImage(img);
      const canvas = document.createElement('canvas');
      const ctx: any = canvas.getContext('2d');
      const imgWidth = imgObj.width - paddings.leftPadding - paddings.rightPadding;

      canvas.width = imgWidth;

      canvas.height = imgObj.height;

      ctx.drawImage(
        imgObj,
        paddings.leftPadding,
        0,
        imgWidth,
        imgObj.height,
        0,
        0,
        imgWidth,
        imgObj.height
      );
      return {
        cover: canvas.toDataURL(),
        name: img.name,
      };
    }

    // Load the image into an Image object
    const imgObj: any = await loadImage(img);

    // Split the image into two halves
    const leftCanvas = document.createElement('canvas');
    const rightCanvas = document.createElement('canvas');

    const leftCtx: any = leftCanvas.getContext('2d');
    const rightCtx: any = rightCanvas.getContext('2d');
    const imgWidth = (imgObj.width - leftPadding - rightPadding - middleWidth) / 2;
    leftCanvas.width = targetImgSize.width;
    leftCanvas.height = targetImgSize.height;
    rightCanvas.width = targetImgSize.width;
    rightCanvas.height = targetImgSize.height;
    // 设置默认背景色
    leftCtx.fillStyle = '#fff';

    // 填充整个 Canvas
    leftCtx.fillRect(0, 0, leftCanvas.width, leftCanvas.height);
    // 设置默认背景色
    rightCtx.fillStyle = '#fff';

    // 填充整个 Canvas
    rightCtx.fillRect(0, 0, rightCanvas.width, rightCanvas.height);
    if (imgWidth > targetImgSize.width || imgObj.height > targetImgSize.height) {
      console.log('bigger');
      const canvas = document.createElement('canvas');
      const ctx: any = canvas.getContext('2d');
      // 确定缩放比例
      const scale = Math.min(targetImgSize.width / imgWidth, targetImgSize.height / imgObj.height);

      // 根据缩放比例计算缩放后的图像尺寸
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgObj.height * scale;
      loggerHandler.append(`scaledWidth:${scaledWidth},scaledHeight:${scaledHeight}`);
      canvas.height = scaledHeight;
      canvas.width = scaledWidth * 2;
      // Draw the cropped image onto the canvas
      ctx.drawImage(
        imgObj,
        leftPadding,
        0,
        imgWidth,
        imgObj.height,
        0,
        0,
        scaledWidth,
        scaledHeight
      );
      ctx.drawImage(
        imgObj,
        leftPadding + imgWidth + middleWidth,
        0,
        imgWidth,
        imgObj.height,
        scaledWidth,
        0,
        scaledWidth,
        scaledHeight
      );
      const newPadding = (targetImgSize.width - scaledWidth) / 2;
      leftCtx.drawImage(
        canvas,
        0,
        0,
        scaledWidth,
        scaledHeight,
        newPadding,
        0,
        scaledWidth,
        scaledHeight
      );

      rightCtx.drawImage(
        canvas,
        scaledWidth,
        0,
        scaledWidth,
        scaledHeight,
        newPadding,
        0,
        scaledWidth,
        scaledHeight
      );
    } else {
      console.log('smaller');
      // 确定缩放比例
      const scale = Math.min(targetImgSize.width / imgWidth, targetImgSize.height / imgObj.height);

      // 根据缩放比例计算缩放后的图像尺寸
      const scaledWidth = imgWidth * scale;

      const scaledHeight = imgObj.height * scale;

      const newPadding = (targetImgSize.width - scaledWidth) / 2;

      leftCtx.drawImage(
        imgObj,
        leftPadding,
        0,
        imgWidth,
        imgObj.height,
        newPadding,
        (targetImgSize.height - scaledHeight) / 2,
        scaledWidth,
        scaledHeight
      );

      rightCtx.drawImage(
        imgObj,
        imgObj.width - rightPadding - imgWidth,
        0,
        imgWidth,
        imgObj.height,
        newPadding,
        (targetImgSize.height - scaledHeight) / 2,
        scaledWidth,
        scaledHeight
      );
    }

    // Convert both canvases to base64 format and return them as an object
    return {
      left: leftCanvas.toDataURL(),
      right: rightCanvas.toDataURL(),
      name: img.name,
    };
  });

  return Promise.all(promises);
}
const SizePreset: any = {
  leaf2: {
    width: 1264,
    height: 1680,
  },
  default: {
    width: 1080,
    height: 1920,
  },
};
async function save(resultImgs: any, cover: any) {
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
export default function HomePage() {
  const theme = useMantineTheme();
  const [fileList, fileListHandler] = useListState<any>([]);
  const [logger, loggerHandler] = useListState<any>([]);

  const [resultImgs, setResultImgs] = useState<any>([]);
  const [coverImg, setCoverImg] = useState<any>(null);
  const [previewList, setPreviewList] = useState<any>([]);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      imgType: 'image/jpeg',
      targetDevice: 'leaf2',
      readFrom: 'rtl',
      autoDetectPaddingColor: true,
      paddingColor: 'white',
      middlePaddingColor: 'white',
      whiteThreshold: 240,
      blackThreshold: 60,
      paddingCheckMethod: 'sample',
    },
  });
  const doProcess = async () => {
    if (
      form.values.imgType === 'application/zip' ||
      form.values.imgType === 'application/vnd.rar'
    ) {
      const target = fileList[0];
      console.log('%c [ target ]-549', 'font-size:13px; background:pink; color:#bf2c9f;', target);
      // 创建一个新的 JSZip 实例
      const zip = new JSZip();

      try {
        // 使用 File API 读取文件内容
        const fileData: any = await readFile(target);

        // 通过 JSZip API 解压文件
        const unzipped = await zip.loadAsync(fileData);

        // 遍历解压后的文件
        unzipped.forEach(async (relativePath, file) => {
          if (!file.dir) {
            // 读取文件内容
            // const content = await file.async('text');

            // 处理文件内容
            console.log(`解压文件 ${relativePath} 内容: `);
          }
        });
      } catch (error) {
        console.error('解压文件时出现错误:', error);
      }
      return;
    }
    setGlobalLoading(true);

    // console.log('%c [ fileList ]-24', 'font-size:13px; background:pink; color:#bf2c9f;', fileList);
    const unProcessedList = fileList.filter(
      (item) => !resultImgs.find((ri: { name: any }) => ri.name === item.name)
    );
    const processedList = await processImages2(
      unProcessedList,
      SizePreset[form.values.targetDevice ?? 'default'],
      {
        loggerHandler,
        form,
      }
    );
    const newList: any = [];
    const { readFrom } = form.values;
    processedList.forEach((item) => {
      if (item.cover) {
        setCoverImg(item.cover);
        return;
      }
      if (item.left) {
        newList.push({
          file: item.left,
          name: `${item.name.replace(/\.\w+$/, '')}_${readFrom === 'rtl' ? '01' : '00'}.jpg`,
        });
      }
      if (item.right) {
        newList.push({
          file: item.right,
          name: `${item.name.replace(/\.\w+$/, '')}_${readFrom === 'rtl' ? '00' : '01'}.jpg`,
        });
      }
    });
    const rImgs = sortBy(uniqBy([...resultImgs, ...newList], 'name'), 'name');
    setResultImgs(rImgs);
    const list = await Promise.all(
      rImgs.map(async (r) => {
        const imageUrl = await base64ToImageUrl(r.file);
        return {
          imageUrl,
          key: r.name,
        };
      })
    );
    setPreviewList(list);
    setGlobalLoading(false);
  };
  useEffect(() => {
    setResultImgs([]);
    setCoverImg(null);
    loggerHandler.setState([]);
    setPreviewList([]);
  }, [form.values]);
  console.log({
    [form.values.imgType]: form.values.imgType === 'application/rar' ? ['.rar'] : [],
  });
  return (
    <>
      <Box pos="relative">
        <Center>
          <Container w="80%">
            <LoadingOverlay visible={globalLoading} style={{ height: '100%' }} />
            <Title ta="center" order={1}>
              漫画拆分
            </Title>
            <Select
              mt={10}
              name="imgType"
              label="选择图片类型"
              placeholder="Pick one"
              searchable
              nothingFound="No options"
              data={[
                { label: 'JPEG', value: 'image/jpeg' },
                { label: 'PNG', value: 'image/png' },
                { label: 'GIF', value: 'image/gif' },
                { label: 'ZIP', value: 'application/zip' },
                { label: 'RAR', value: 'application/vnd.rar' },
              ]}
              {...form.getInputProps('imgType')}
            />
            <Select
              mt={10}
              name="readFrom"
              label="选择漫画翻页类型"
              placeholder="Pick one"
              searchable
              nothingFound="No options"
              data={[
                { label: '从右往左', value: 'rtl' },
                { label: '从左往右', value: 'ltr' },
              ]}
              {...form.getInputProps('readFrom')}
            />
            <Select
              mt={10}
              name="targetDevice"
              label="选择目标机型"
              placeholder="Pick one"
              searchable
              nothingFound="No options"
              data={[{ label: 'BOOX Leaf2', value: 'leaf2' }]}
              {...form.getInputProps('targetDevice')}
            />
            <Dropzone
              mt={20}
              onDrop={(files) => {
                console.log('accepted files', files);
                const uniqueList = uniqBy([...fileList, ...files], 'name');
                fileListHandler.setState(uniqueList);
              }}
              //   onReject={(files) => console.log('rejected files', files)}
              //   maxSize={3 * 1024 ** 2}
              accept={{
                [form.values.imgType]:
                  form.values.imgType === 'application/vnd.rar' ? ['.rar'] : [],
              }}
              //   {...props}
            >
              <Group
                position="center"
                spacing="xl"
                style={{ minHeight: rem(220), pointerEvents: 'none' }}
              >
                <Dropzone.Accept>
                  <IconUpload
                    size="3.2rem"
                    stroke={1.5}
                    color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size="3.2rem"
                    stroke={1.5}
                    color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto size="3.2rem" stroke={1.5} />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    拖入或者点击上传文件
                  </Text>
                  {/* <Text size="sm" color="dimmed" inline mt={7}>
                  Attach as many files as you like, each file should not exceed 5mb
                </Text> */}
                </div>
              </Group>
            </Dropzone>
            <Accordion defaultValue="" mt={20}>
              <Accordion.Item value="setting">
                <Accordion.Control>高级设置</Accordion.Control>
                <Accordion.Panel>
                  <Switch
                    label="自动检测padding颜色"
                    name="autoDetectPaddingColor"
                    {...form.getInputProps('autoDetectPaddingColor', { type: 'checkbox' })}
                  />
                  {!form.values.autoDetectPaddingColor && (
                    <Box mt={10}>
                      <Select
                        mt={10}
                        name="paddingColor"
                        label="两边padding颜色"
                        placeholder="Pick one"
                        searchable
                        nothingFound="No options"
                        data={[
                          { label: '白色', value: 'white' },
                          { label: '黑色', value: 'black' },
                        ]}
                        {...form.getInputProps('paddingColor')}
                      />
                      <Select
                        mt={10}
                        name="middlePaddingColor"
                        label="中间padding颜色"
                        placeholder="Pick one"
                        searchable
                        nothingFound="No options"
                        data={[
                          { label: '白色', value: 'white' },
                          { label: '黑色', value: 'black' },
                        ]}
                        {...form.getInputProps('middlePaddingColor')}
                      />
                    </Box>
                  )}
                  <Radio.Group
                    mt={20}
                    name="paddingCheckMethod"
                    label="Padding的检测方式"
                    {...form.getInputProps('paddingCheckMethod')}
                  >
                    <Group mt="xs">
                      <Radio value="full" label="全量检测" />
                      <Radio value="sample" label="样本检测" />
                    </Group>
                  </Radio.Group>
                  <Title mt={20} order={6}>
                    白色检测阈值
                  </Title>

                  <Slider
                    labelAlwaysOn
                    mt={10}
                    label={form.values.whiteThreshold}
                    min={0}
                    max={255}
                    name="whiteThreshold"
                    {...form.getInputProps('whiteThreshold')}
                  />
                  <Title mt={20} order={6}>
                    黑色检测阈值
                  </Title>
                  <Slider
                    labelAlwaysOn
                    mt={10}
                    label={form.values.blackThreshold}
                    min={0}
                    max={255}
                    name="blackThreshold"
                    {...form.getInputProps('blackThreshold')}
                  />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="logger">
                <Accordion.Control>日志</Accordion.Control>
                <Accordion.Panel>
                  <ScrollArea h={250}>
                    {logger.map((log: any) => {
                      return (
                        <>
                          <Text>{log}</Text>
                          <br />
                        </>
                      );
                    })}
                  </ScrollArea>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="preview">
                <Accordion.Control>结果预览</Accordion.Control>
                <Accordion.Panel>
                  <ScrollArea h={250}>
                    <SimpleGrid
                      cols={4}
                      breakpoints={[{ maxWidth: 'sm', cols: 1 }]}
                      mt={previewList.length > 0 ? 'xl' : 0}
                    >
                      {previewList.map((item: any) => {
                        const preset = SizePreset[form.values.targetDevice];

                        return (
                          <AspectRatio key={item.key} ratio={preset.width / preset.height} w={200}>
                            <MImage
                              width={200}
                              height="100%"
                              src={item.imageUrl}
                              imageProps={{ onLoad: () => URL.revokeObjectURL(item.imageUrl) }}
                            />
                          </AspectRatio>
                        );
                      })}
                    </SimpleGrid>
                  </ScrollArea>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
            <Group>
              <Button mt={20} onClick={() => loggerHandler.setState([])}>
                清除日志
              </Button>
              <Button mt={20} onClick={() => fileListHandler.setState([])}>
                清空文件
              </Button>
              <Button
                mt={20}
                onClick={async () => {
                  await doProcess();
                }}
              >
                开始处理
              </Button>
              <Button
                mt={20}
                disabled={resultImgs.length === 0}
                onClick={async () => {
                  setGlobalLoading(true);
                  await save(resultImgs, coverImg);
                  setGlobalLoading(false);
                  setResultImgs([]);
                  setCoverImg(null);
                  loggerHandler.setState([]);
                  setPreviewList([]);
                  fileListHandler.setState([]);
                }}
              >
                输出
              </Button>
            </Group>
          </Container>
        </Center>
      </Box>
      {/* <div class="max-w-lg mx-auto">
        <h1 class="text-2xl font-bold mb-5">Image Cropper</h1>
        <div class="mb-5">
          <label for="image-type" class="block font-medium mb-2">
            选择图片类型:
          </label>
          <select
            id="image-type"
            name="image-type"
            class="w-full bg-gray-100 text-gray-800 py-2 px-4 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/gif">GIF</option>
          </select>
        </div>
        <div class="mb-5">
          <label for="targetDevice" class="block font-medium mb-2">
            目标机型:
          </label>
          <select
            id="targetDevice"
            name="targetDevice"
            class="w-full bg-gray-100 text-gray-800 py-2 px-4 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="leaf2">BOOX Leaf2</option>
          </select>
        </div>

        <div class="mb-5">
          <label for="images" class="block mb-2">
            Select Images
          </label>
          <input
            type="file"
            name="images"
            id="images"
            class="block w-full border p-2 rounded-md"
            accept="image/*"
            multiple
          />
        </div>
        <button id="previewBtn" class="bg-blue-500 text-white py-2 px-4 rounded-md">
          预览
        </button>
        <button id="clearPreview" class="bg-blue-500 text-white py-2 px-4 rounded-md">
          清空预览
        </button>
        <button
          id="processBtn"
          class="bg-blue-500 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          裁剪
          <span id="loading-btn-text" class="hidden">
            {' '}
            Loading...
          </span>
        </button>

        <div class="mt-5 flex flex-wrap" id="previewBox"></div>
      </div> */}
    </>
  );
}
