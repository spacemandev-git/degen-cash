use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct InitGlobalDCMintInputValues;

    #[instruction]
    pub fn init_global_dc_mint(input_ctxt: Enc<Mxe, InitGlobalDCMintInputValues>) -> Enc<Mxe, u64> {
        input_ctxt.owner.from_arcis(0_u64)
    }
}
