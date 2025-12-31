<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeController extends Controller
{
    /**
     * Generate QR code for an inventory item
     * 
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function generateItemQrCode($id)
    {
        $item = Item::findOrFail($id);
        
        // QR code data: item ID and inventory number
        $qrData = json_encode([
            'id' => $item->id,
            'inventory_number' => $item->inventory_number,
            'name' => $item->name,
            'type' => 'inventory_item'
        ]);
        
        // Generate QR code as PNG
        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->errorCorrection('H')
            ->generate($qrData);
        
        return response($qrCode)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', 'inline; filename="item-' . $item->inventory_number . '-qr.png"');
    }
    
    /**
     * Generate QR code as base64 for embedding
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getItemQrCodeBase64($id)
    {
        $item = Item::findOrFail($id);
        
        // QR code data
        $qrData = json_encode([
            'id' => $item->id,
            'inventory_number' => $item->inventory_number,
            'name' => $item->name,
            'type' => 'inventory_item'
        ]);
        
        // Generate QR code as base64
        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->errorCorrection('H')
            ->generate($qrData);
        
        $base64 = base64_encode($qrCode);
        
        return response()->json([
            'qr_code' => 'data:image/png;base64,' . $base64,
            'item' => [
                'id' => $item->id,
                'inventory_number' => $item->inventory_number,
                'name' => $item->name
            ]
        ]);
    }
    
    /**
     * Decode QR code data (for scanning)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function decodeQrCode(Request $request)
    {
        $request->validate([
            'qr_data' => 'required|string'
        ]);
        
        try {
            $data = json_decode($request->qr_data, true);
            
            if (!$data || !isset($data['type']) || $data['type'] !== 'inventory_item') {
                return response()->json([
                    'error' => 'Invalid QR code data'
                ], 400);
            }
            
            // Fetch item details
            $item = Item::with(['category', 'vendor'])
                ->findOrFail($data['id']);
            
            return response()->json([
                'success' => true,
                'item' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to decode QR code: ' . $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Generate bulk QR codes for multiple items
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function generateBulkQrCodes(Request $request)
    {
        $request->validate([
            'item_ids' => 'required|array',
            'item_ids.*' => 'exists:items,id'
        ]);
        
        $items = Item::whereIn('id', $request->item_ids)->get();
        
        $qrCodes = [];
        
        foreach ($items as $item) {
            $qrData = json_encode([
                'id' => $item->id,
                'inventory_number' => $item->inventory_number,
                'name' => $item->name,
                'type' => 'inventory_item'
            ]);
            
            $qrCode = QrCode::format('png')
                ->size(300)
                ->margin(2)
                ->errorCorrection('H')
                ->generate($qrData);
            
            $qrCodes[] = [
                'item_id' => $item->id,
                'inventory_number' => $item->inventory_number,
                'name' => $item->name,
                'qr_code' => 'data:image/png;base64,' . base64_encode($qrCode)
            ];
        }
        
        return response()->json([
            'qr_codes' => $qrCodes
        ]);
    }
}
