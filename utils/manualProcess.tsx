import { Group, NumberInput, Slider, Stack, Switch, Title } from '@mantine/core';
import Jimp from 'jimp';

export const manualProcess: any = {
  empty: {
    displayName: '无处理',
    value: 'empty',
    initProps: {},
    optionRender: (currentProcessModalInfo: any, form: any) => {
      const target = form.values.splitManualSteps[currentProcessModalInfo.formIndex];

      const exInfoPath = `splitManualSteps.${currentProcessModalInfo.formIndex}.exInfo`;
      if (!target.exInfo) {
        form.setFieldValue(exInfoPath, {});
      }
      return <></>;
    },
    process: async (jimpImgs: Jimp[], exInfo: any) => jimpImgs,
  },
  crop: {
    displayName: '裁剪',
    value: 'crop',
    initProps: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    optionRender: (currentProcessModalInfo: any, form: any) => {
      const target = form.values.splitManualSteps[currentProcessModalInfo.formIndex];
      const exInfoPath = `splitManualSteps.${currentProcessModalInfo.formIndex}.exInfo`;
      if (!target.exInfo) {
        form.setFieldValue(exInfoPath, {});
      }
      return (
        <>
          <Group mt={20}>
            <NumberInput min={0} label="左边距" {...form.getInputProps(`${exInfoPath}.left`)} />
            <NumberInput min={0} label="顶部边距" {...form.getInputProps(`${exInfoPath}.top`)} />
            <NumberInput min={0} label="右边距" {...form.getInputProps(`${exInfoPath}.right`)} />
            <NumberInput min={0} label="底部边距" {...form.getInputProps(`${exInfoPath}.bottom`)} />
          </Group>
        </>
      );
    },
    process: async (jimpImgs: Jimp[], exInfo: any) =>
      Promise.all(
        jimpImgs.map(async (jimpImg: Jimp) =>
          jimpImg.crop(
            exInfo.left,
            exInfo.top,
            jimpImg.bitmap.width - exInfo.right,
            jimpImg.bitmap.height - exInfo.bottom
          )
        )
      ),
  },
  cropAuto: {
    displayName: '裁剪（自动）',
    value: 'cropAuto',
    initProps: {
      tolerance: 1,
      cropOnlyFrames: false,
    },
    optionRender: (currentProcessModalInfo: any, form: any) => {
      const target = form.values.splitManualSteps[currentProcessModalInfo.formIndex];
      const exInfoPath = `splitManualSteps.${currentProcessModalInfo.formIndex}.exInfo`;
      const exInfo = form.values.splitManualSteps[currentProcessModalInfo.formIndex].exInfo;
      if (!target.exInfo) {
        form.setFieldValue(exInfoPath, {});
      }
      return (
        <>
          <Stack w={'100%'}>
            <Title order={6}>边距颜色检测误差区间</Title>

            <Group mt={20} w={'100%'}>
              <Slider
                w={'100%'}
                labelAlwaysOn
                mt={10}
                label={exInfo?.tolerance / 100}
                min={0}
                max={100}
                {...form.getInputProps(`${exInfoPath}.tolerance`)}
              />
            </Group>
            <Switch
              mt={20}
              label="四边同步裁剪"
              {...form.getInputProps(`${exInfo}.cropOnlyFrames`, { type: 'checkbox' })}
            />
          </Stack>
        </>
      );
    },
    process: async (jimpImgs: Jimp[], exInfo: any) => {
      console.log('%c [ exInfo ]-83', 'font-size:13px; background:pink; color:#bf2c9f;', exInfo);
      console.log(
        '%c [ jimpImgs ]-83',
        'font-size:13px; background:pink; color:#bf2c9f;',
        jimpImgs
      );
      return Promise.all(
        jimpImgs.map(async (jimpImg: Jimp) =>
          jimpImg.autocrop({
            tolerance: exInfo.tolerance / 100,
            cropOnlyFrames: exInfo.cropOnlyFrames,
          })
        )
      );
    },
  },
  middleSplit: {
    displayName: '从中拆分为两张',
    value: 'middleSplit',
    initProps: {},
    optionRender: (currentProcessModalInfo: any, form: any) => {
      const target = form.values.splitManualSteps[currentProcessModalInfo.formIndex];
      const exInfoPath = `splitManualSteps.${currentProcessModalInfo.formIndex}.exInfo`;
      if (!target.exInfo) {
        form.setFieldValue(exInfoPath, {});
      }
      return (
        <>
          <Group mt={20} />
        </>
      );
    },
    process: async (jimpImgs: Jimp[]) => {
      const images: any[] = [];
      await Promise.all(
        jimpImgs.map(async (jimpImg: Jimp) => {
          const leftImg = await jimpImg
            .clone()
            .crop(0, 0, jimpImg.bitmap.width / 2, jimpImg.bitmap.height);

          const rightImg = await jimpImg
            .clone()
            .crop(jimpImg.bitmap.width / 2, 0, jimpImg.bitmap.width / 2, jimpImg.bitmap.height);
          images.push(leftImg);
          images.push(rightImg);
        })
      );
      console.log('%c [ images ]-124', 'font-size:13px; background:pink; color:#bf2c9f;', images);
      return images;
    },
  },
};
