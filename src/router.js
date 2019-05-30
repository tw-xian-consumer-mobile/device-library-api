import { Router } from 'express';

import DeviceController from './controller/DeviceController';
import RecordController from './controller/RecordController';

import { DEVICE_STATUS } from './model/device';
import { RECORD_TYPE } from './model/record';

const router = Router();

router.get('/', (req, res) => {
  res.type('text/html');
  res.send("<h1 style=\"text-align: center;\"> Hello, Device Library(小借借)! </h1>");
});

router.get('/devices', (req, res, next) => {
  res.type('application/json');
  const recordController = new RecordController();
  const controller = new DeviceController();
  const devices = controller.getDevices();
  if (devices.length > 0) {
    res.status(200);
    res.send(devices);
  } else {
    next();
  }
});

router.get('/devices/:id', (req, res, next) => {
  const controller = new DeviceController();
  const recordController = new RecordController();
  const device = controller.getDeviceBy(req.params.id);
  recordController.getLatestRecordFor(device.id, latestRecord => {
    const status = (latestRecord && latestRecord.type == RECORD_TYPE.BORROW) ? DEVICE_STATUS.UNAVAILABLE : DEVICE_STATUS.AVAILABLE;
    res.type('application/json');
    if (device) {
      res.status(200);
      res.send(Object.assign(JSON.parse(JSON.stringify(device)), { status: status }));
    } else {
      next();
    }
  });
});

router.get('/records', (req, res, next) => {
  const controller = new RecordController();
  controller.getRecords((err, records) => {
    if (err) {
      res.status(500);
      res.send("500 Internal Error: " + err);
      return;
    }
    if (records.length > 0) {
      const deviceController = new DeviceController();
      const newRecords = records.map(record => {
        const devices = record.deviceIDs.map(id => deviceController.getDeviceBy(id))
        return Object.assign(JSON.parse(JSON.stringify(record)), { devices: devices }, { deviceIDs: undefined, __v: undefined});
      });
      res.status(200);
      res.send(newRecords);
    } else {
      next();
    }
  });
});

router.post('/records', (req, res) => {
  const recordDocument = req.body;
  const recordController = new RecordController();
  recordController.createRecord(recordDocument, (err, result) => {
    res.type('application/json');
    const deviceController = new DeviceController();
    const devices = result.deviceIDs.map(id => deviceController.getDeviceBy(id));
    res.send(Object.assign(JSON.parse(JSON.stringify(result)), { devices: devices }, { deviceIDs: undefined, __v: undefined }));
  });
});

export default router;
