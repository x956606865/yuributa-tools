import { Group, NumberInput, Select, Slider, Stack, Switch, Title } from '@mantine/core';
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
            jimpImg.bitmap.width - exInfo.right - exInfo.left,
            jimpImg.bitmap.height - exInfo.bottom - exInfo.top
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
  contain: {
    displayName: '等比缩放(contain)',
    value: 'contain',
    initProps: {
      w: 0,
      h: 0,
      hAlign: Jimp.HORIZONTAL_ALIGN_CENTER,
      vAlign: Jimp.VERTICAL_ALIGN_MIDDLE,
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
            <NumberInput
              min={0}
              label="宽度（0为保持原有宽度）"
              {...form.getInputProps(`${exInfoPath}.w`)}
            />
            <NumberInput
              min={0}
              label="高度（0为保持原有高度）"
              {...form.getInputProps(`${exInfoPath}.h`)}
            />
            <Select
              mt={20}
              label="水平对齐方式"
              data={[
                {
                  value: Jimp.HORIZONTAL_ALIGN_LEFT,
                  label: '左对齐',
                },
                {
                  value: Jimp.HORIZONTAL_ALIGN_CENTER,
                  label: '水平居中',
                },
                {
                  value: Jimp.HORIZONTAL_ALIGN_RIGHT,
                  label: '右对齐',
                },
              ]}
              {...form.getInputProps(`${exInfoPath}.hAlign`)}
            />

            <Select
              mt={20}
              label="垂直对齐方式"
              data={[
                {
                  value: Jimp.VERTICAL_ALIGN_TOP,
                  label: '顶部对齐',
                },
                {
                  value: Jimp.VERTICAL_ALIGN_MIDDLE,
                  label: '垂直居中',
                },
                {
                  value: Jimp.VERTICAL_ALIGN_BOTTOM,
                  label: '底部对齐',
                },
              ]}
              {...form.getInputProps(`${exInfoPath}.vAlign`)}
            />
          </Group>
        </>
      );
    },
    process: async (jimpImgs: Jimp[], exInfo: any) =>
      Promise.all(
        jimpImgs.map(async (jimpImg: Jimp) => {
          const { w, h, hAlign, vAlign } = exInfo;
          const width = w === 0 ? jimpImg.bitmap.width : w;
          const height = h === 0 ? jimpImg.bitmap.height : h;
          // eslint-disable-next-line no-bitwise
          return jimpImg.contain(width, height, hAlign | vAlign);
        })
      ),
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
