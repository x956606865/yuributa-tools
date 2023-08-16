/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-shadow */
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
  Progress,
  TextInput,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useListState } from '@mantine/hooks';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons';
import { sortBy, uniq, uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import {
  base64ToImageUrl,
  calcSample,
  loadImage,
  saveCBZ,
  saveEpub,
} from '../../utils/output.util';

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
  };
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
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const i of sampleIndex) {
      const img = imgList[i];
      // eslint-disable-next-line no-await-in-loop
      const { leftPadding, rightPadding } = await checkPadding(img, {
        loggerHandler,
        form,
      });
      r.leftPadding.push(leftPadding);
      r.rightPadding.push(rightPadding);
    }
    if (sampleIndex.length > 3) {
      paddingResult.leftPadding = calcSample(r.leftPadding);
      paddingResult.rightPadding = calcSample(r.rightPadding);
    } else {
      paddingResult.leftPadding = r.leftPadding[0];
      paddingResult.rightPadding = r.rightPadding[0];
    }
  }
  const promises = imgList.map(async (img: any, index: any) => {
    console.log(`process images ${index + 1}/${imgList.length}`);
    loggerHandler.append(`process images ${index}/${imgList.length}`);
    let leftPadding;
    let rightPadding;
    if (form.values.paddingCheckMethod === 'sample') {
      ({ leftPadding, rightPadding } = paddingResult);
    } else {
      ({ leftPadding, rightPadding } = await checkPadding(img, {
        form,
        loggerHandler,
      }));
    }
    loggerHandler.append(`使用的padding为：${leftPadding},${rightPadding}`);

    if (img.name.includes('cover')) {
      const paddings = await checkPadding(img, {
        form,
        loggerHandler,
      });
      loggerHandler.append(
        `Cover 使用的padding为：${paddings.leftPadding},${paddings.rightPadding}`
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
        cover: canvas.toDataURL('image/jpeg', 0.8),
        name: img.name,
      };
    }

    // Load the image into an Image object
    const imgObj: any = await loadImage(img);

    // Split the image into two halves
    const leftCanvas = document.createElement('canvas');

    const leftCtx: any = leftCanvas.getContext('2d');
    const imgWidth = imgObj.width - leftPadding - rightPadding;
    leftCanvas.width = targetImgSize.width;
    leftCanvas.height = targetImgSize.height;
    // 设置默认背景色
    leftCtx.fillStyle = '#fff';

    // 填充整个 Canvas
    leftCtx.fillRect(0, 0, leftCanvas.width, leftCanvas.height);

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
    }

    // Convert both canvases to base64 format and return them as an object
    return {
      file: leftCanvas.toDataURL('image/jpeg', 0.8),
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

export default function MangaResize() {
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
      autoDetectPaddingColor: true,
      paddingColor: 'white',
      whiteThreshold: 240,
      blackThreshold: 60,
      paddingCheckMethod: 'sample',
      outputType: 'epub',
      fileName: 'images',
      name: 'unknown',
      author: 'unknown',
    },
  });
  const doProcess = async () => {
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
    processedList.forEach((item) => {
      if (item.cover) {
        setCoverImg(item.cover);
        return;
      }
      if (item.file) {
        newList.push({
          file: item.file,
          name: item.name,
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

  return (
    <>
      <Box pos="relative">
        <Center>
          <Container w="80%">
            <LoadingOverlay visible={globalLoading} style={{ height: '100%' }} />
            <Title ta="center" order={1}>
              漫画Resize
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

            <Progress
              mt={20}
              size={24}
              value={resultImgs.length}
              label={`处理进度:${resultImgs.length}/${fileList.length}`}
              radius="xl"
            />
            <Accordion defaultValue="" mt={20}>
              <Accordion.Item value="bookInfo">
                <Accordion.Control>输出设置</Accordion.Control>
                <Accordion.Panel>
                  <Box mt={10}>
                    <Select
                      mt={10}
                      name="outputType"
                      label="输出格式"
                      placeholder="Pick one"
                      searchable
                      nothingFound="No options"
                      data={[
                        { label: 'epub', value: 'epub' },
                        { label: 'cbz', value: 'cbz' },
                      ]}
                      {...form.getInputProps('outputType')}
                    />
                    <TextInput mt={20} label="文件名称" {...form.getInputProps('fileName')} />
                    {form.values.outputType === 'epub' && (
                      <TextInput mt={20} label="作品名称" {...form.getInputProps('name')} />
                    )}
                    {form.values.outputType === 'epub' && (
                      <TextInput mt={20} label="作者" {...form.getInputProps('author')} />
                    )}
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
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
                  if (form.values.outputType === 'cbz') {
                    await saveCBZ(resultImgs, coverImg);
                  } else {
                    await saveEpub(form, resultImgs, coverImg);
                  }
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
    </>
  );
}
