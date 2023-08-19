/* eslint-disable max-len */
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
  TextInput,
  NumberInput,
  Grid,
  Stack,
  Modal,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useDisclosure, useListState } from '@mantine/hooks';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons';
import { sortBy, uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import {
  base64ToImageUrl,
  calcSample,
  checkPaddingDouble,
  checkPaddingSingle,
  getRandomSamples,
  loadImage,
  saveCBZ,
  saveEpub,
} from '../../utils/output.util';

async function checkPadding(type: string, img: any, { loggerHandler, form }: any) {
  if (type === 'single') {
    return checkPaddingSingle(img, { loggerHandler, form });
  }
  return checkPaddingDouble(img, { loggerHandler, form });
}

async function splitMangaList(imgList: any, targetImgSize: any, { loggerHandler, form, paddingResult, coverName }: any) {
  const promises = imgList.map(async (img: any, index: any) => {
    console.log(`process images ${index + 1}/${imgList.length}`);
    loggerHandler.append(`process images ${index}/${imgList.length}`);
    if (img.name === coverName) {
      return {
        skip: true,
      };
    }
    let leftPadding;
    let rightPadding;
    let middleWidth;
    if (form.values.paddingCheckMethod === 'sample' || !form.values.isProcessPadding || !form.values.autoDetectPaddingWidth) {
      ({ leftPadding, rightPadding, middleWidth } = paddingResult);
    } else {
      ({ leftPadding, rightPadding, middleWidth } = await checkPadding('double', img, {
        form,
        loggerHandler,
      }));
    }
    loggerHandler.append(`使用的padding为：${leftPadding},${rightPadding},${middleWidth}`);

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
      left: leftCanvas.toDataURL('image/jpeg', 0.8),
      right: rightCanvas.toDataURL('image/jpeg', 0.8),
      name: img.name,
    };
  });

  return Promise.all(promises);
}
async function resizeMangaList(imgList: any, targetImgSize: any, { loggerHandler, form, paddingResult, coverName }: any) {
  const promises = imgList.map(async (img: any, index: any) => {
    console.log(`process images ${index + 1}/${imgList.length}`);
    loggerHandler.append(`process images ${index}/${imgList.length}`);
    if (img.name === coverName) {
      return {
        skip: true,
      };
    }
    let leftPadding;
    let rightPadding;
    if (form.values.paddingCheckMethod === 'sample') {
      ({ leftPadding, rightPadding } = paddingResult);
    } else {
      ({ leftPadding, rightPadding } = await checkPadding('single', img, {
        form,
        loggerHandler,
      }));
    }
    loggerHandler.append(`使用的padding为：${leftPadding},${rightPadding}`);

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
async function processImages2(imgList: any, targetImgSize: any, { loggerHandler, form, coverName }: any) {
  const checkMethod = form.values.paddingCheckMethod;
  const paddingResult: any = {};
  if (imgList.length === 0) {
    return [];
  }
  if (form.values.extraProcess === 'none') {
    const promises = imgList.map(async (img: any) => {
      const imgObj: any = await loadImage(img);
      const canvas = document.createElement('canvas');
      const ctx: any = canvas.getContext('2d');
      const imgWidth = imgObj.width;
      canvas.width = imgWidth;
      canvas.height = imgObj.height;
      ctx.drawImage(
        imgObj,
        0,
        0,
        imgWidth,
        imgObj.height,
        0,
        0,
        imgWidth,
        imgObj.height
      );
      if (img.name.includes('cover')) {
        return {
          cover: canvas.toDataURL('image/jpeg', 0.8),
          name: img.name,
        };
      }
      return {
        file: canvas.toDataURL('image/jpeg', 0.8),
        name: img.name,
      };
    });
    return Promise.all(promises);
  }
  if (!form.values.isProcessPadding) {
    paddingResult.leftPadding = 0;
    paddingResult.rightPadding = 0;
    paddingResult.middleWidth = 0;
  } else if (!form.values.autoDetectPaddingWidth) {
    paddingResult.leftPadding = form.values.customLeftPadding;
    paddingResult.rightPadding = form.values.customRightPadding;
    paddingResult.middleWidth = form.values.customMiddlePadding;
  } else if (checkMethod === 'sample') {
    const sampleIndex = getRandomSamples(imgList);

    const r: any = {
      leftPadding: [],
      rightPadding: [],
      middleWidth: [],
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const i of sampleIndex) {
      const img = imgList[i];
      // eslint-disable-next-line no-await-in-loop
      const { leftPadding, rightPadding, middleWidth } = await checkPadding('double', img, {
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
  if (form.values.extraProcess === 'resize') {
    return resizeMangaList(imgList, targetImgSize, { loggerHandler, form, paddingResult, coverName });
  } if (form.values.extraProcess === 'split') {
    return splitMangaList(imgList, targetImgSize, { loggerHandler, form, paddingResult, coverName });
  }
  return [];
}
async function processCover(img: any, { form,
  loggerHandler }: any) {
  const paddings = await checkPadding('single', img, {
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

function getFileName({ form }: any) {
  if (form.values.customFileName) {
    return `${form.values.fileName}.${form.values.outputType}`;
  }
  return `${form.values.name}${form.values.author.length === 0 ? '' : `[${form.values.author}]`}${form.values.volume === 0 ? '' : `[${form.values.volume < 10 ? `0${form.values.volume}` : form.values.volume}]`}`;
}
const SizePreset: any = {
  leaf2: {
    width: 1264,
    height: 1680,
    label: 'BOOX Leaf2',
  },
  default: {
    width: 1080,
    height: 1920,
    label: 'Default (1080p)',
  },
  custom: {
    width: 0,
    height: 0,
    label: '自定义',
  },
};
const ProcessType: any = {
  none: '无',
  split: '漫画拆分',
  resize: '漫画Resize',
};
export default function HomePage() {
  const theme = useMantineTheme();
  const [fileList, fileListHandler] = useListState<any>([]);
  const [logger, loggerHandler] = useListState<any>([]);

  const [resultImgs, setResultImgs] = useState<any>([]);
  const [coverImg, setCoverImg] = useState<any>(null);
  const [previewList, setPreviewList] = useState<any>([]);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [ImageViewModalOpened, ImageViewModal] = useDisclosure(false);
  const [previewImage, setPreviewImage] = useState<any>(null)
  const [isLoadingPreviewImage, setIsLoadingPreviewImage] = useState(false)
  const form = useForm({
    initialValues: {
      imgType: 'image/jpeg',
      targetDevice: 'leaf2',
      readFrom: 'rtl',
      extraProcess: 'none',
      autoDetectPaddingColor: true,
      autoDetectPaddingWidth: true,
      isProcessPadding: true,
      customDeviceWidth: 0,
      customDeviceHeight: 0,
      customLeftPadding: 0,
      customRightPadding: 0,
      customMiddlePadding: 0,
      volume: 0,
      customFileName: false,
      paddingColor: 'white',
      middlePaddingColor: 'white',
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
    let deviceSize = SizePreset[form.values.targetDevice ?? 'default'];
    if (form.values.targetDevice === 'custom') {
      deviceSize = {
        width: form.values.customDeviceWidth,
        height: form.values.customDeviceHeight,
      };
    }
    const processedList = await processImages2(
      unProcessedList,
      deviceSize,
      {
        loggerHandler,
        form,
        coverName: coverImg.name,
      }
    );
    const newList: any = [];
    const { readFrom } = form.values;
    processedList.forEach((item) => {
      if (item.cover) {
        setCoverImg(item);
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
      if (item.file) {
        newList.push({
          file: item.file,
          name: `${item.name}.jpg`,
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
          file: r.file
        };
      })
    );
    setPreviewList(list);
    setGlobalLoading(false);
  };
  useEffect(() => {
    setResultImgs([]);
    // setCoverImg(null);
    // if (coverImg) {

    //   processCover(coverImg.file, { form, loggerHandler }).then(result => base64ToImageUrl(result.cover).then(imageUrl => {
    //     setCoverImg({
    //       ...result,
    //       imageUrl
    //     })
    //   }))
    // }
    const newFileName = getFileName({ form });
    if (form.values.fileName !== newFileName && !form.values.customFileName) {
      form.setValues({
        ...form.values,
        fileName: newFileName,
      });
    }
    loggerHandler.setState([]);
    setPreviewList([]);
  }, [form.values]);

  return (
    <>
      <Modal
        size={700}
        opened={ImageViewModalOpened}
        onClose={() => {
          ImageViewModal.close()
          setPreviewImage(null)
        }}
        withCloseButton={false}
      // title="图片预览"
      >
        <LoadingOverlay visible={isLoadingPreviewImage} />
        <ScrollArea h={1000}>
          <Center>
            {
              previewImage && (
                <MImage
                  width={600}
                  height="100%"
                  src={previewImage.imageUrl}
                  imageProps={{
                    onLoad: () => {
                      URL.revokeObjectURL(previewImage.imageUrl)
                      setIsLoadingPreviewImage(false)
                    }
                  }}
                />
              )
            }
          </Center>

        </ScrollArea>



      </Modal>
      <Box pos="relative">
        <Center>
          <Container w="80%">
            <LoadingOverlay visible={globalLoading} style={{ height: '100%' }} />
            <Title ta="center" order={1}>
              漫画打包
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
              data={Object.entries(SizePreset).map(([key, v]: any) => ({ label: v.label, value: key }))}
              {...form.getInputProps('targetDevice')}
            />
            {
              form.values.targetDevice === 'custom' && (
                <Group mt={20}>
                  <NumberInput min={0} label="自定义宽度" {...form.getInputProps('customDeviceWidth')} />
                  <NumberInput min={0} label="自定义高度" {...form.getInputProps('customDeviceHeight')} />
                </Group>)
            }
            <TextInput mt={20} label="作品名称" {...form.getInputProps('name')} />
            <Group mt={20} align="flex-end" grow>
              <TextInput disabled={!form.values.customFileName} label="文件名称" {...form.getInputProps('fileName')} />
              <Switch
                label="自定义文件名"
                name="customFileName"
                {...form.getInputProps('customFileName', { type: 'checkbox' })}
              />
            </Group>
            <NumberInput min={0} mt={20} label="第x卷 (无卷数漫画设为0)" {...form.getInputProps('volume')} />

            {form.values.outputType === 'epub' && (
              <TextInput mt={20} label="作者" {...form.getInputProps('author')} />
            )}
            <Dropzone
              mt={20}
              onDrop={(files) => {
                console.log('accepted files', files);
                const uniqueList = sortBy(uniqBy([...fileList, ...files], 'name'), f => f.name);
                if (!coverImg) {
                  // 尝试嗅探封面
                  const cover = uniqueList.find(f => f.name.includes('cover'));
                  let target;
                  if (cover) {
                    target = cover;
                  } else {
                    target = uniqueList[0];
                  }
                  processCover(target, { form, loggerHandler }).then(result => base64ToImageUrl(result.cover).then(imageUrl => {
                    setCoverImg({
                      ...result,
                      imageUrl,
                    });
                  }));
                }
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
            <Accordion defaultValue="baseInfo" mt={20}>
              <Accordion.Item value="baseInfo">
                <Accordion.Control>基础信息</Accordion.Control>
                <Accordion.Panel pl={20} pr={20}>
                  {
                    fileList.length > 0 ? (
                      <Grid>
                        <Grid.Col span={4}>
                          {
                            coverImg && (
                              <Stack>
                                <MImage
                                  width={200}
                                  height="100%"
                                  src={coverImg.imageUrl}
                                  imageProps={{ onLoad: () => URL.revokeObjectURL(coverImg.imageUrl) }}
                                />
                                <Select
                                  value={coverImg.name}
                                  w={200}
                                  data={fileList.map(f => ({ value: f.name, label: f.name, disabled: f.name === coverImg.name }))}
                                  onChange={fileName => {
                                    const cover = fileList.find(f => f.name === fileName);
                                    let target;
                                    if (cover) {
                                      target = cover;
                                      processCover(target, { form, loggerHandler }).then(result => base64ToImageUrl(result.cover).then(imageUrl => {
                                        setCoverImg({
                                          ...result,
                                          imageUrl,
                                        });
                                      }));
                                    }
                                  }}
                                />
                              </Stack>
                            )
                          }

                        </Grid.Col>
                        <Grid.Col span={8}>
                          <ScrollArea h={250}>
                            <Group>
                              <Text fw={700}>已处理文件/当前文件:</Text> <Text color="green">{`${resultImgs.length}/${fileList.length}`}</Text>

                            </Group>
                            <Group>
                              <Text fw={700}>保存为:</Text><Text color="green"> {`${getFileName({ form })}.${form.values.outputType}`}</Text>
                            </Group>
                            <Group>
                              <Text fw={700}>输出分辨率:</Text><Text color="green"> {`${form.values.targetDevice === 'custom' ? form.values.customDeviceWidth : SizePreset[form.values.targetDevice].width}x${form.values.targetDevice === 'custom' ? form.values.customDeviceHeight : SizePreset[form.values.targetDevice].height}`}</Text>
                            </Group>
                            <Group>
                              <Text fw={700}>额外处理:</Text><Text color="green"> {ProcessType[form.values.extraProcess]}</Text>
                            </Group>
                          </ScrollArea>
                        </Grid.Col>
                      </Grid>
                    )
                      : <Center>请上传图片</Center>
                  }

                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="setting">
                <Accordion.Control>处理设置</Accordion.Control>
                <Accordion.Panel pl={20} pr={20}>
                  <Select
                    mt={10}
                    name="extraProcess"
                    label="额外处理"
                    placeholder="Pick one"
                    searchable
                    nothingFound="No options"
                    data={Object.keys(ProcessType).map(k => ({ label: ProcessType[k], value: k }))}
                    {...form.getInputProps('extraProcess')}
                  />
                  {
                    form.values.extraProcess !== 'none' && (
                      <Box mt={20}>
                        {
                          form.values.extraProcess === 'split' && (
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
                          )
                        }
                        <Group mt={20}>
                          <Switch
                            label="裁剪padding"
                            name="isProcessPadding"
                            {...form.getInputProps('isProcessPadding', { type: 'checkbox' })}
                          />
                          {
                            form.values.isProcessPadding && (
                              <Switch
                                label="自动检测padding颜色"
                                name="autoDetectPaddingColor"
                                {...form.getInputProps('autoDetectPaddingColor', { type: 'checkbox' })}
                              />
                            )
                          }
                          {
                            form.values.isProcessPadding && (
                              <Switch
                                label="自动检测padding宽度"
                                name="autoDetectPaddingWidth"
                                {...form.getInputProps('autoDetectPaddingWidth', { type: 'checkbox' })}
                              />
                            )
                          }
                        </Group>

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
                        {
                          !form.values.autoDetectPaddingWidth && (
                            <Group mt={20}>
                              <NumberInput min={0} label="自定义左侧padding宽度" {...form.getInputProps('customLeftPadding')} />
                              <NumberInput min={0} label="自定义右侧padding宽度" {...form.getInputProps('customRightPadding')} />
                              <NumberInput min={0} label="自定义中间padding宽度" {...form.getInputProps('customMiddlePadding')} />
                            </Group>)
                        }
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
                      </Box>)
                  }

                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="bookInfo">
                <Accordion.Control>输出设置</Accordion.Control>
                <Accordion.Panel pl={20} pr={20}>
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

                  </Box>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="logger">
                <Accordion.Control>日志</Accordion.Control>
                <Accordion.Panel pl={20} pr={20}>
                  <ScrollArea h={250}>
                    {logger.map((log: any) => (
                      <>
                        <Text>{log}</Text>
                        <br />
                      </>
                    ))}
                  </ScrollArea>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="preview">
                <Accordion.Control>结果预览</Accordion.Control>
                <Accordion.Panel pl={20} pr={20}>
                  <ScrollArea h={250}>
                    <SimpleGrid
                      cols={4}
                      breakpoints={[{ maxWidth: 'sm', cols: 1 }]}
                      mt={previewList.length > 0 ? 'xl' : 0}
                    >
                      {previewList.map((item: any, index: number) => {
                        const preset = SizePreset[form.values.targetDevice];

                        return (
                          <AspectRatio key={index} ratio={preset.width / preset.height} w={200}>
                            <MImage
                              style={{
                                cursor: 'zoom-in'
                              }}
                              onClick={async () => {
                                setIsLoadingPreviewImage(true)
                                const imageUrl = await base64ToImageUrl(item.file);
                                setPreviewImage({
                                  imageUrl,
                                })
                                ImageViewModal.open()
                              }}
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
              <Button
                mt={20}
                onClick={() => {
                  fileListHandler.setState([]);
                  setResultImgs([]);
                }}
              >
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
                    await saveCBZ(resultImgs, coverImg.cover);
                  } else {
                    await saveEpub(form, resultImgs, coverImg.cover);
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
